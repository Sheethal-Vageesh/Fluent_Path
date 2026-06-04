const express = require('express');
const { z } = require('zod');

const { requireAuth, requireRole } = require('../middleware/auth');
const { Parent } = require('../models/Parent');
const { Clinician } = require('../models/Clinician');
const { StrategyAssignment } = require('../models/StrategyAssignment');
const { PracticeSubmission } = require('../models/PracticeSubmission');
const { Message } = require('../models/Message');
const { validate } = require('../utils/validate');
const { createUploader, toPublicUploadUrl } = require('../utils/upload');
const { SessionSubmission } = require('../models/SessionSubmission')

const parentRouter = express.Router();

// Returns a Date (UTC) representing the next midnight in IST (UTC+5:30) after the provided date
function nextMidnightIST(date) {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000 // ms
  const t = date.getTime()
  const ist = new Date(t + IST_OFFSET)
  const y = ist.getUTCFullYear()
  const m = ist.getUTCMonth()
  const d = ist.getUTCDate()
  // midnight IST of the next day -> compute its UTC ms and subtract offset
  const nextMidnightUtc = Date.UTC(y, m, d + 1) - IST_OFFSET
  return new Date(nextMidnightUtc)
}




parentRouter.get('/me', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parent = await Parent.findById(req.user.parentId);
    if (!parent) {
      const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ');
      err.statusCode = 404;
      throw err;
    }

    const clinician = await Clinician.findById(parent.clinicianId).select('_id name specialization clinicName');

    res.json({
      parent: {
        id: parent._id,
        childId: parent.childId,
        childName: parent.childName,
        childAge: parent.childAge,
        parentName: parent.parentName,
        email: parent.email,
        phone: parent.phone,
        status: parent.status,
        clinician: clinician
          ? {
              id: clinician._id,
              name: clinician.name,
              specialization: clinician.specialization,
              clinicName: clinician.clinicName,
            }
          : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

parentRouter.get('/assignments', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const parent = await Parent.findById(parentId);
    if (!parent) {
      const err = new Error('Parent not found');
      err.statusCode = 404;
      throw err;
    }

    const assignments = await StrategyAssignment.find({
      parentId,
      clinicianId: parent.clinicianId,
      active: true,
      completedAt: null,
    })
      .sort({ assignedAt: -1 })
      .populate('strategyId');

    res.json({
      assignments: assignments.map((a) => ({
        id: a._id,
        assignedAt: a.assignedAt,
        strategy: a.strategyId
          ? {
              id: a.strategyId._id,
              title: a.strategyId.title,
              kannadaText: a.strategyId.kannadaText || '',
              demoVideoUrl: a.strategyId.demoVideoUrl || '',
            }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

parentRouter.get('/assignments/completed', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const parent = await Parent.findById(parentId);
    if (!parent) {
      const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ');
      err.statusCode = 404;
      throw err;
    }

    const assignments = await StrategyAssignment.find({
      parentId,
      clinicianId: parent.clinicianId,
      completedAt: { $ne: null },
    })
      .sort({ completedAt: -1 })
      .populate('strategyId');

    res.json({
      assignments: assignments.map((a) => ({
        id: a._id,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
        strategy: a.strategyId
          ? {
              id: a.strategyId._id,
              title: a.strategyId.title,
              kannadaText: a.strategyId.kannadaText || '',
              demoVideoUrl: a.strategyId.demoVideoUrl || '',
            }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

const assignmentIdParamSchema = z.object({
  assignmentId: z.string().min(1),
});

parentRouter.get('/assignments/:assignmentId', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const { assignmentId } = validate(assignmentIdParamSchema, req.params);
    const assignment = await StrategyAssignment.findOne({ _id: assignmentId, parentId }).populate('strategyId');
    if (!assignment) {
      const err = new Error('Assignment not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({
      assignment: {
        id: assignment._id,
        assignedAt: assignment.assignedAt,
        strategy: assignment.strategyId
        ? {
            id: assignment.strategyId._id,
            title: assignment.strategyId.title,
            kannadaText: assignment.strategyId.kannadaText || '',
            demoVideoUrl: assignment.strategyId.demoVideoUrl || '',
          }
        : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

const progressUploader = createUploader({ subdir: 'practice-videos' });


parentRouter.post(
  '/assignments/:assignmentId/progress',
  requireAuth,
  requireRole('parent'),
  progressUploader.single('practiceVideo'),
  async (req, res, next) => {
    try {
      const parentId = req.user.parentId;
      const { assignmentId } = validate(assignmentIdParamSchema, req.params);

      const bodySchema = z.object({
        durationSeconds: z.coerce
          .number()
          .int()
          .min(0, 'Invalid duration / ಅಮಾನ್ಯ ಸಮಯ'),

        sessionNumber: z.coerce
          .number()
          .int()
          .min(1, 'Session starts from 1 / ಸೆಷನ್ 1 ರಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ')
          .max(10, 'Maximum 10 sessions / ಗರಿಷ್ಠ 10 ಸೆಷನ್'),
      });

      const data = validate(bodySchema, req.body);

      const parent = await Parent.findById(parentId);
      if (!parent) {
        const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ');
        err.statusCode = 404;
        throw err;
      }

      const assignment = await StrategyAssignment.findOne({
        _id: assignmentId,
        parentId,
      });

      if (!assignment) {
        const err = new Error('Assignment not found / ಕಾರ್ಯ ಲಭ್ಯವಿಲ್ಲ');
        err.statusCode = 404;
        throw err;
      }

      // ✅ Prevent duplicate submission per session
      const existing = await PracticeSubmission.findOne({
        assignmentId: assignment._id,
        sessionNumber: data.sessionNumber,
      });

      if (existing) {
        const err = new Error('Already submitted for this session / ಈ ಸೆಷನ್‌ಗೆ ಈಗಾಗಲೇ ಸಲ್ಲಿಸಲಾಗಿದೆ');
        err.statusCode = 400;
        throw err;
      }

      const practiceVideoUrl = req.file
        ? toPublicUploadUrl(req, req.file.path)
        : '';

      const submissionData = {
        clinicianId: parent.clinicianId,
        parentId,
        assignmentId: assignment._id,
        strategyId: assignment.strategyId,
        durationSeconds: data.durationSeconds,
        sessionNumber: data.sessionNumber,
        practiceVideoUrl,
        submittedAt: new Date(),
      };

      if (req.body.StutteringSeverityRating !== undefined) {
        submissionData.StutteringSeverityRating = Number(req.body.StutteringSeverityRating);
        submissionData.stuttering = Number(req.body.StutteringSeverityRating);
      }

      if (req.body.SpeechNaturalnessRating !== undefined) {
        submissionData.SpeechNaturalnessRating = Number(req.body.SpeechNaturalnessRating);
        submissionData.naturalness = Number(req.body.SpeechNaturalnessRating);
      }

      const submission = await PracticeSubmission.create(submissionData);

      res.status(201).json({
        ok: true,
        submissionId: submission._id,
        message: 'Progress submitted successfully',
        kannadaMessage: 'ಪ್ರಗತಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
      });
    } catch (e) {
      next(e);
    }
  }
);



const messageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

parentRouter.get('/messages', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const parent = await Parent.findById(parentId);
    if (!parent) {
      const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ');
      err.statusCode = 404;
      throw err;
    }

    const messages = await Message.find({ clinicianId: parent.clinicianId, parentId }).sort({ createdAt: -1 }).limit(200);
    res.json({
      messages: messages
        .map((m) => ({ id: m._id, senderRole: m.senderRole, text: m.text, createdAt: m.createdAt }))
        .reverse(),
    });
  } catch (e) {
    next(e);
  }
});

parentRouter.get(
  '/sessions',
  requireAuth,
  requireRole('parent'),
  async (req, res, next) => {
    try {
      const parentId = req.user.parentId

      // all submitted sessions
          const AUTO_SUBMIT_MS = 24 * 60 * 60 * 1000
      const sessionSubmissions = await SessionSubmission.find({ parentId })
      const now = new Date()

      const staleSessions = sessionSubmissions.filter(
        (s) => s.startedAt && !s.submittedAt && now - new Date(s.startedAt) > AUTO_SUBMIT_MS
      )

      if (staleSessions.length > 0) {
        await Promise.all(
          staleSessions.map((s) =>
            SessionSubmission.findByIdAndUpdate(
              s._id,
              {
                submittedAt: new Date(),
                autoSubmitted: true,
              },
              { new: true }
            )
          )
        )
      }

      const refreshedSubmissions = await SessionSubmission.find({ parentId })
      const submissionMap = {}
      refreshedSubmissions.forEach((s) => {
        submissionMap[s.sessionNumber] = s
      })

      const submittedMap = {}
      Object.values(submissionMap).forEach((s) => {
        if (s.submittedAt) {
          submittedMap[s.sessionNumber] = true
        }
      })

      const sessions = Array.from({ length: 10 }, (_, i) => {
        const num = i + 1
        const record = submissionMap[num] || {}
        const startedAt = record.startedAt || null
        const expiresAt = startedAt
          ? new Date(new Date(startedAt).getTime() + AUTO_SUBMIT_MS)
          : null
        const active = Boolean(startedAt && !record.submittedAt && expiresAt && now < expiresAt)

        // compute locked and lockedUntil based on previous session submission
        let locked = false
        let lockedUntil = null

        if (num !== 1) {
          const prev = submissionMap[num - 1]
          if (!prev || !prev.submittedAt) {
            // previous not submitted at all -> lock indefinitely until previous is submitted
            locked = true
            lockedUntil = null
          } else if (prev.autoSubmitted) {
            // previous auto-submitted -> allow immediate start
            locked = false
            lockedUntil = null
          } else {
            // previous manually submitted -> lock until next midnight IST
            const nextMidnight = nextMidnightIST(new Date(prev.submittedAt))
            lockedUntil = nextMidnight
            if (now < nextMidnight) locked = true
          }
        }

        return {
          sessionNumber: num,
          completed: !!record.submittedAt,
          active,
          startedAt,
          expiresAt,
          locked,
          lockedUntil,
        }
      })

      res.json({ sessions })
    } catch (e) {
      next(e)
    }
  }
)

parentRouter.get(
  '/session/:sessionNumber',
  requireAuth,
  requireRole('parent'),
  async (req, res, next) => {
    try {
      const parentId = req.user.parentId
      const sessionNumber = Number(req.params.sessionNumber)

      const parent = await Parent.findById(parentId)
      if (!parent) {
        const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ')
        err.statusCode = 404
        throw err
      }

      // check session submitted
      const now = new Date()
      const AUTO_SUBMIT_MS = 24 * 60 * 60 * 1000
      // enforce lock based on previous session (per new rules)
      if (sessionNumber !== 1) {
        const prev = await SessionSubmission.findOne({ parentId, sessionNumber: sessionNumber - 1 })
        if (!prev || !prev.submittedAt) {
          return res.status(400).json({ ok: false, error: 'Previous session not submitted / ಹಿಂದಿನ ಸೆಷನ್ ಸಲ್ಲಿಸಲಾಗಿಲ್ಲ', lockedUntil: null })
        }
        if (!prev.autoSubmitted) {
          const nextMidnight = nextMidnightIST(new Date(prev.submittedAt))
          if (now < nextMidnight) {
            return res.status(400).json({ ok: false, error: 'Next session locked until midnight IST after manual submission / ಮುಂದಿನ ಸೆಷನ್ IST ಮಧ್ಯರಾತ್ರಿ ತೆರೆಯಲಾಗುತ್ತದೆ', lockedUntil: nextMidnight })
          }
        }
      }

      let sessionSubmission = await SessionSubmission.findOne({
        parentId,
        sessionNumber,
      })

      if (!sessionSubmission) {
        sessionSubmission = await SessionSubmission.create({
          parentId,
          clinicianId: parent.clinicianId,
          sessionNumber,
          startedAt: now,
        })
      } else if (!sessionSubmission.submittedAt && sessionSubmission.startedAt) {
        const startedAtDate = new Date(sessionSubmission.startedAt)
        if (now - startedAtDate > AUTO_SUBMIT_MS) {
          sessionSubmission.submittedAt = now
          sessionSubmission.autoSubmitted = true
          await sessionSubmission.save()
        }
      }

      const assignments = await StrategyAssignment.find({
        parentId,
        active: true,
      }).populate('strategyId')

      const submissions = await PracticeSubmission.find({
        parentId,
        sessionNumber,
      })

      // compute locked and lockedUntil for this session (per new rules)
      let sessionLocked = false
      let sessionLockedUntil = null

      if (sessionNumber !== 1) {
        const prev = await SessionSubmission.findOne({ parentId, sessionNumber: sessionNumber - 1 })
        if (!prev || !prev.submittedAt) {
          sessionLocked = true
          sessionLockedUntil = null
        } else if (prev.autoSubmitted) {
          sessionLocked = false
          sessionLockedUntil = null
        } else {
          const nextMidnight = nextMidnightIST(new Date(prev.submittedAt))
          sessionLockedUntil = nextMidnight
          if (now < nextMidnight) sessionLocked = true
        }
      }

      res.json({
        assignments: assignments.map((a) => ({
          id: a._id,
          strategy: a.strategyId
            ? {
                id: a.strategyId._id,
                title: a.strategyId.title,
                kannadaText: a.strategyId.kannadaText || '',
                demoVideoUrl: a.strategyId.demoVideoUrl || '',
              }
            : null,
        })),

        submissions,

        // IMPORTANT
        sessionSubmitted: !!sessionSubmission.submittedAt,
        sessionStartedAt: sessionSubmission.startedAt || null,
        sessionExpiresAt: sessionSubmission.startedAt
          ? new Date(new Date(sessionSubmission.startedAt).getTime() + AUTO_SUBMIT_MS)
          : null,
        sessionActive:
          !!sessionSubmission.startedAt &&
          !sessionSubmission.submittedAt &&
          sessionSubmission.startedAt &&
          now < new Date(new Date(sessionSubmission.startedAt).getTime() + AUTO_SUBMIT_MS),
        sessionExpired:
          !!sessionSubmission.startedAt &&
          !sessionSubmission.submittedAt &&
          sessionSubmission.startedAt &&
          now >= new Date(new Date(sessionSubmission.startedAt).getTime() + AUTO_SUBMIT_MS),
        sessionAutoSubmitted: !!sessionSubmission.autoSubmitted,
        sessionLocked,
        sessionLockedUntil,
      })
    } catch (e) {
      next(e)
    }
  }
)

parentRouter.post(
  '/session/:sessionNumber/submit',
  requireAuth,
  requireRole('parent'),
  async (req, res, next) => {
    try {
      const parentId = req.user.parentId
      const sessionNumber = Number(req.params.sessionNumber)

      const bodySchema = z.object({
        StutteringSeverityRating: z.coerce
          .number()
          .int()
          .min(0, 'Minimum is 0 / ಕನಿಷ್ಠ ಮೌಲ್ಯ 0')
          .max(9, 'Maximum is 9 / ಗರಿಷ್ಠ 9'),

        SpeechNaturalnessRating: z.coerce
          .number()
          .int()
          .min(1, 'Minimum is 1 / ಕನಿಷ್ಠ ಮೌಲ್ಯ 1')
          .max(9, 'Maximum is 9 / ಗರಿಷ್ಠ 9'),
      })

      const data = validate(bodySchema, req.body)

      // check already submitted
      let existing = await SessionSubmission.findOne({
        parentId,
        sessionNumber,
      })

      const now = new Date()
      const AUTO_SUBMIT_MS = 24 * 60 * 60 * 1000

      if (existing && existing.submittedAt) {
        const err = new Error(
          'Session already submitted / ಸೆಷನ್ ಈಗಾಗಲೇ ಸಲ್ಲಿಸಲಾಗಿದೆ'
        )
        err.statusCode = 400
        throw err
      }

      if (existing && existing.startedAt && now - new Date(existing.startedAt) > AUTO_SUBMIT_MS) {
        existing.submittedAt = now
        existing.autoSubmitted = true
        await existing.save()

        const err = new Error(
          'Session has already been auto-submitted after 24 hours / 24 ಗಂಟೆಗಳ ನಂತರ ಸೆಷನ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'
        )
        err.statusCode = 400
        throw err
      }

      const parent = await Parent.findById(parentId)

      if (existing) {
        existing.StutteringSeverityRating = data.StutteringSeverityRating
        existing.SpeechNaturalnessRating = data.SpeechNaturalnessRating
        existing.submittedAt = now
        existing.autoSubmitted = false
        await existing.save()
      } else {
        await SessionSubmission.create({
          parentId,
          clinicianId: parent.clinicianId,
          sessionNumber,
          startedAt: now,
          StutteringSeverityRating: data.StutteringSeverityRating,
          SpeechNaturalnessRating: data.SpeechNaturalnessRating,
          submittedAt: now,
        })
      }

      res.json({
        ok: true,
        message:
          'Session submitted successfully / ಸೆಷನ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ',
      })
    } catch (e) {
      next(e)
    }
  }
)
parentRouter.post('/messages', requireAuth, requireRole('parent'), async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const { text } = validate(messageSchema, req.body);
    const parent = await Parent.findById(parentId);
    if (!parent) {
      const err = new Error('Parent not found / ಪೋಷಕರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ');
      err.statusCode = 404;
      throw err;
    }

    const msg = await Message.create({
      clinicianId: parent.clinicianId,
      parentId,
      childId: parent.childId,
      senderRole: 'parent',
      text,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: {
        id: msg._id,
        senderRole: msg.senderRole,
        text: msg.text,
        createdAt: msg.createdAt,
      },

      info: 'Message sent successfully',
      kannadaInfo: 'ಸಂದೇಶ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ',
    });
  } catch (e) {
    next(e);
  }
});





module.exports = { parentRouter };

