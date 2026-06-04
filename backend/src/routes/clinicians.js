const express = require('express');
const { z } = require('zod');

const { Clinician } = require('../models/Clinician');
const { ParentRequest } = require('../models/ParentRequest');
const { Parent } = require('../models/Parent');
const { Strategy } = require('../models/Strategy');
const { StrategyAssignment } = require('../models/StrategyAssignment');
const { PracticeSubmission } = require('../models/PracticeSubmission');
const { Message } = require('../models/Message');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../utils/validate');
const { sendChildIdNotification, sendStrategiesAssignedNotification } = require('../utils/mailer');
const { sendChildIdSms } = require('../utils/sms');
const { createUploader, persistUploadedFile } = require('../utils/upload');
const { SessionSubmission } = require('../models/SessionSubmission')


const clinicianRouter = express.Router();

clinicianRouter.get('/public', async (_req, res, next) => {
  try {
    const clinicians = await Clinician.find({})
      .sort({ createdAt: -1 })
      .select('_id name specialization clinicName');
    res.json({
      clinicians: clinicians.map((c) => ({
        id: c._id,
        name: c.name,
        specialization: c.specialization,
        clinicName: c.clinicName,
      })),
    });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.get('/me', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinician = await Clinician.findById(req.user.clinicianId).select('-passwordHash');
    if (!clinician) {
      const err = new Error('Clinician not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ clinician });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.get('/requests', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const requests = await ParentRequest.find({ clinicianId, status: 'pending' }).sort({ createdAt: -1 });
    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        childName: r.childName,
        childAge: r.childAge,
        parentName: r.parentName,
        email: r.email,
        phone: r.phone,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.get('/children', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const children = await Parent.find({ clinicianId, status: 'active' }).sort({ createdAt: -1 });
    res.json({
      children: children.map((p) => ({
        id: p._id,
        childId: p.childId,
        childName: p.childName,
        childAge: p.childAge,
        parentName: p.parentName,
        email: p.email,
        phone: p.phone,
        createdAt: p.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

const childIdParamSchema = z.object({
  childId: z.string().min(1),
});

clinicianRouter.get('/children/:childId', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({
      child: {
        id: child._id,
        childId: child.childId,
        childName: child.childName,
        childAge: child.childAge,
        parentName: child.parentName,
        email: child.email,
        phone: child.phone,
        createdAt: child.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

const assignSchema = z.object({
  strategyIds: z.array(z.string().min(1)).default([]),
});

clinicianRouter.get(
  '/progress-dashboard',
  requireAuth,
  requireRole('clinician'),
  async (req, res, next) => {
    try {

      const clinicianId = req.user.clinicianId

      const parents = await Parent.find({
        clinicianId,
      })

      const result = await Promise.all(
        parents.map(async (p) => {

          const sessions =
            await SessionSubmission.find({
              parentId: p._id,
            })

          const sessionSubmissions = sessions

          let avgSeverity = 0
          let severityTrend = []

          if (sessionSubmissions.length > 0) {
            const validSessions = sessionSubmissions.filter(
              (s) => s.StutteringSeverityRating != null
            )

            if (validSessions.length > 0) {
              avgSeverity =
                validSessions.reduce(
                  (sum, s) => sum + Number(s.StutteringSeverityRating || 0),
                  0
                ) / validSessions.length

              severityTrend = validSessions.map((s) => ({
                day: s.sessionNumber,
                severity: Number(
                  Number(s.StutteringSeverityRating || 0).toFixed(1)
                ),
              }))
            }
          }

          return {
            id: p._id,
            childId: p.childId,
            childName: p.childName,
            childAge: p.childAge,

            parentName: p.parentName,
            email: p.email,
            phone: p.phone,

            completedSessions: sessions.length,
            severityTrend,
            averageSeverity: Number(avgSeverity.toFixed(1)),
            baselineSeverity: p.baselineSeverity,
          }
        })
      )

      res.json({
        children: result,
      })

    } catch (e) {
      next(e)
    }
  }
)

clinicianRouter.get('/children/:childId/assignments', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    const assignments = await StrategyAssignment.find({ clinicianId, parentId: child._id, active: true })
      .sort({ assignedAt: -1 })
      .populate('strategyId');

    res.json({
      assignments: assignments.map((a) => ({
        id: a._id,
        assignedAt: a.assignedAt,
        strategy: a.strategyId
          ? { id: a.strategyId._id, title: a.strategyId.title, demoVideoUrl: a.strategyId.demoVideoUrl || '' }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.post('/children/:childId/assignments', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const { strategyIds } = validate(assignSchema, req.body);

    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    // Validate strategies belong to clinician
    const strategies = await Strategy.find({ clinicianId, _id: { $in: strategyIds } }).select('_id title');
    const okIds = new Set(strategies.map((s) => s._id.toString()));
    const filtered = strategyIds.filter((id) => okIds.has(id));

    // Deactivate any assignments not in the new list
    await StrategyAssignment.updateMany(
      { clinicianId, parentId: child._id, active: true, strategyId: { $nin: filtered } },
      { $set: { active: false } }
    );

   
    // Upsert assignments in the list
    const newlyAssignedTitles = [];
    for (const sid of filtered) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await StrategyAssignment.findOneAndUpdate(
        { clinicianId, parentId: child._id, strategyId: sid },
        { $set: { active: true, assignedAt: new Date() } },
        { upsert: true, new: true }
      );
      if (!existing || !existing.completedAt) {
        const strat = strategies.find((s) => s._id.toString() === sid);
        if (strat) newlyAssignedTitles.push(strat.title);
      }
    }

    let emailed = false;
    if (child.email && child.email.includes('@')) {
      if (newlyAssignedTitles.length > 0) {
        const clinician = await Clinician.findById(clinicianId);
        await sendStrategiesAssignedNotification({
          toEmail: child.email,
          childName: child.childName,
          clinicianName: clinician ? clinician.name : 'your clinician',
          strategyTitles: newlyAssignedTitles,
        });
        emailed = true;
      }
    }
    res.json({ ok: true, emailed });
}catch (e) {
    if (e && e.code === 11000) {
      const err = new Error('Duplicate assignment');
      err.statusCode = 409;
      return next(err);
    }
    next(e);
  }
});

clinicianRouter.get('/children/:childId/progress', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    const submissions = await PracticeSubmission.find({ clinicianId, parentId: child._id })
      .sort({ submittedAt: -1 })
      .populate('strategyId');

    const sessionRatings = await SessionSubmission.find({ clinicianId, parentId: child._id })
      .sort({ sessionNumber: 1 });

    res.json({
      submissions: submissions.map((s) => ({
        id: s._id,
        sessionNumber: s.sessionNumber,
        stuttering: s.StutteringSeverityRating,
        naturalness: s.SpeechNaturalnessRating,
        durationSeconds: s.durationSeconds,
        practiceVideoUrl: s.practiceVideoUrl || '',
        submittedAt: s.submittedAt,
        strategy: s.strategyId ? { id: s.strategyId._id, title: s.strategyId.title } : null,
      })),
      sessionRatings: sessionRatings.map((s) => ({
        id: s._id,
        sessionNumber: s.sessionNumber,
        stuttering: s.StutteringSeverityRating,
        naturalness: s.SpeechNaturalnessRating,
        submittedAt: s.submittedAt,
        autoSubmitted: s.autoSubmitted || false,
      })),
    });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.delete('/children/:childId', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const child = await Parent.findOne({ _id: childId, clinicianId });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    await StrategyAssignment.deleteMany({ clinicianId, parentId: child._id });
    await PracticeSubmission.deleteMany({ clinicianId, parentId: child._id });
    await Message.deleteMany({ clinicianId, parentId: child._id });
    await ParentRequest.deleteOne({ _id: child.requestId, clinicianId });
    await Parent.deleteOne({ _id: child._id, clinicianId });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const messageBodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

clinicianRouter.get('/children/:childId/dashboard', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);

    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    const submissions = await PracticeSubmission.find({
      clinicianId,
      parentId: child._id,
    }).populate('strategyId');

    const assignments = await StrategyAssignment.find({
      clinicianId,
      parentId: child._id,
      active: true,
    });

    // 🔹 Group by session
    const sessions = {};
    submissions.forEach((s) => {
      const sn = s.sessionNumber;
      if (!sessions[sn]) sessions[sn] = [];
      sessions[sn].push(s);
    });

    // 🔹 Build session stats
    const sessionStats = Object.keys(sessions).map((sn) => {
      const list = sessions[sn];

      return {
        session: Number(sn),
        count: list.length,
        avgSeverity:
          list.reduce((sum, x) => sum + x.StutteringSeverityRating, 0) / list.length,
        completed: list.length === assignments.length, // all strategies done
      };
    });

    res.json({
      sessionStats,
      totalStrategies: assignments.length,
    });

  } catch (e) {
    next(e);
  }
});

clinicianRouter.get('/children/:childId/messages', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    const messages = await Message.find({ clinicianId, parentId: child._id }).sort({ createdAt: -1 }).limit(100);
    res.json({
      messages: messages
        .map((m) => ({ id: m._id, senderRole: m.senderRole, text: m.text, createdAt: m.createdAt }))
        .reverse(),
    });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.post('/children/:childId/messages', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { childId } = validate(childIdParamSchema, req.params);
    const { text } = validate(messageBodySchema, req.body);

    const child = await Parent.findOne({ _id: childId, clinicianId, status: 'active' });
    if (!child) {
      const err = new Error('Child not found');
      err.statusCode = 404;
      throw err;
    }

    const msg = await Message.create({
      clinicianId,
      parentId: child._id,
      childId: child.childId,
      senderRole: 'clinician',
      text,
      createdAt: new Date(),
    });

    res.status(201).json({ message: { id: msg._id, senderRole: msg.senderRole, text: msg.text, createdAt: msg.createdAt } });
  } catch (e) {
    next(e);
  }
});

clinicianRouter.get('/strategies', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const strategies = await Strategy.find({ clinicianId }).sort({ createdAt: -1 });
    res.json({
      strategies: strategies.map((s) => ({
        id: s._id,
        title: s.title,
        kannadaText: s.kannadaText || '',
        demoVideoUrl: s.demoVideoUrl || '',
        createdAt: s.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
});

const createStrategySchema = z.object({
  title: z.string().trim().min(2).max(2000),

  kannadaText: z
    .string()
    .trim()
    .optional()
    .default(''),
});

const demoUploader = createUploader({ subdir: 'strategy-demos' });

clinicianRouter.post(
  '/strategies',
  requireAuth,
  requireRole('clinician'),
  demoUploader.single('demoVideo'),
  async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const data = validate(createStrategySchema, req.body);
    const demoVideoUrl = req.file
      ? await persistUploadedFile(req.file, 'strategy-demos')
      : '';
    const strategy = await Strategy.create({
      clinicianId,
      title: data.title,
      kannadaText: data.kannadaText,
      demoVideoUrl,
    });
    res.status(201).json({
      strategy: { id: strategy._id, title: strategy.title, demoVideoUrl: strategy.demoVideoUrl, createdAt: strategy.createdAt },
    });
  } catch (e) {
    if (e && e.code === 11000) {
      const err = new Error('Strategy title already exists');
      err.statusCode = 409;
      return next(err);
    }
    next(e);
  }
});

const deleteStrategySchema = z.object({
  strategyId: z.string().min(1),
});

clinicianRouter.delete('/strategies/:strategyId', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const clinicianId = req.user.clinicianId;
    const { strategyId } = validate(deleteStrategySchema, req.params);
    const deleted = await Strategy.findOneAndDelete({ _id: strategyId, clinicianId });
    if (!deleted) {
      const err = new Error('Strategy not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});


const acceptSchema = z.object({
  requestId: z.string().min(1),
  childId: z
    .string()
    .trim()
    .min(4)
    .max(16)
    .regex(/^[A-Za-z0-9-]+$/, 'Child ID must be letters/numbers (and -) only'),
  baselineSeverity: z.enum(['Very Mild', 'Mild', 'Moderate', 'Severe', 'Very Severe']),
});

clinicianRouter.post('/requests/accept', requireAuth, requireRole('clinician'), async (req, res, next) => {
  try {
    const { requestId, childId: rawChildId, baselineSeverity } = validate(acceptSchema, req.body);
    const clinicianId = req.user.clinicianId;

    const request = await ParentRequest.findOne({ _id: requestId, clinicianId });
    if (!request) {
      const err = new Error('Request not found');
      err.statusCode = 404;
      throw err;
    }
    if (request.status !== 'pending') {
      const err = new Error('Request already processed');
      err.statusCode = 409;
      throw err;
    }

    const childId = rawChildId.trim().toUpperCase();
    const exists = await Parent.findOne({ childId });
    if (exists) {
      const err = new Error('Child ID already in use');
      err.statusCode = 409;
      throw err;
    }

    const parent = await Parent.create({
      clinicianId: request.clinicianId,
      requestId: request._id,
      childName: request.childName,
      childAge: request.childAge,
      parentName: request.parentName,
      email: request.email || '',
      phone: request.phone,
      childId,
      status: 'active',
      baselineSeverity,
    });

    request.status = 'accepted';
    request.childId = childId;
    await request.save();

    const clinician = await Clinician.findById(clinicianId);
    const sms = await sendChildIdSms({
      toPhone: request.phone,
      childId,
      clinicianName: clinician ? clinician.name : 'your clinician',
    });
    if(request.email) {
    await sendChildIdNotification({
      toEmail: request.email,
      childId,
      clinicianName: clinician ? clinician.name : 'your clinician',
    });
  }
    res.json({
      message: 'Request accepted',
      childId,
      smsDelivered: sms.delivered,
      parent: { id: parent._id, childId: parent.childId },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = { clinicianRouter };

