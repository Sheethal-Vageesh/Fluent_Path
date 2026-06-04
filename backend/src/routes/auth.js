const express = require('express');
const { z } = require('zod');

const { Clinician } = require('../models/Clinician');
const { Parent } = require('../models/Parent');
const { ParentRequest } = require('../models/ParentRequest');
const { validate } = require('../utils/validate');
const { hashPassword, verifyPassword, signToken } = require('../utils/security');
const { requireAuth } = require('../middleware/auth');

const authRouter = express.Router();

const clinicianRegisterSchema = z.object({
  name: z.string().min(2),
  specialization: z.string().min(2),
  clinicName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
});

const clinicianLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const parentRequestSchema = z.object({
  clinicianId: z.string().min(1),
  childName: z.string().min(1),
  childAge: z.coerce.number().min(1).max(6).refine(
    (val) => /^\d+(\.\d)?$/.test(val.toString()),
    {
      message: 'Age must have at most one digit after the decimal',
    }
  ),
  parentName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(6),
});

const parentLoginSchema = z.object({
  childId: z.string().min(4),
});


authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

authRouter.post('/clinician/register', async (req, res, next) => {
  try {
    const data = validate(clinicianRegisterSchema, req.body);
    const exists = await Clinician.findOne({ email: data.email.toLowerCase() });
    if (exists) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await hashPassword(data.password);
    const clinician = await Clinician.create({
      name: data.name,
      specialization: data.specialization,
      clinicName: data.clinicName,
      email: data.email,
      phone: data.phone,
      passwordHash,
    });

    const token = signToken({ role: 'clinician', clinicianId: clinician._id.toString() });
    res.status(201).json({
      token,
      clinician: {
        id: clinician._id,
        name: clinician.name,
        specialization: clinician.specialization,
        clinicName: clinician.clinicName,
        email: clinician.email,
        phone: clinician.phone,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/clinician/login', async (req, res, next) => {
  try {
    const data = validate(clinicianLoginSchema, req.body);
    const clinician = await Clinician.findOne({ email: data.email.toLowerCase() });
    if (!clinician) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }
    const ok = await verifyPassword(data.password, clinician.passwordHash);
    if (!ok) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken({ role: 'clinician', clinicianId: clinician._id.toString() });
    res.json({
      token,
      clinician: {
        id: clinician._id,
        name: clinician.name,
        specialization: clinician.specialization,
        clinicName: clinician.clinicName,
        email: clinician.email,
        phone: clinician.phone,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/parent/request', async (req, res, next) => {
  try {
    const data = validate(parentRequestSchema, req.body);
    const clinician = await Clinician.findById(data.clinicianId);
    if (!clinician) {
      const err = new Error('Clinician not found');
      err.statusCode = 404;
      throw err;
    }

    const request = await ParentRequest.create({
      clinicianId: clinician._id,
      childName: data.childName,
      childAge: data.childAge,
      parentName: data.parentName,
      email: data.email || '',
      phone: data.phone,
      status: 'pending',
    });

    res.status(201).json({
      requestId: request._id,
      status: request.status,
      message: 'Request sent to clinician',
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/parent/login', async (req, res, next) => {
  try {
    const data = validate(parentLoginSchema, req.body);
    const parent = await Parent.findOne({ childId: data.childId, status: 'active' });
    if (!parent) {
      const err = new Error('Invalid Child ID (or not yet accepted)');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken({ role: 'parent', parentId: parent._id.toString(), childId: parent.childId });
    res.json({
      token,
      parent: {
        id: parent._id,
        childId: parent.childId,
        childName: parent.childName,
        childAge: parent.childAge,
        parentName: parent.parentName,
        email: parent.email || '',
        phone: parent.phone,
        clinicianId: parent.clinicianId,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = { authRouter };

