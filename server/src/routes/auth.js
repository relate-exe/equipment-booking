const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

const sign = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post(
  '/register',
  validate([
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters'),
  ]),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    // The first account created becomes the admin who manages the equipment catalogue
    const role = (await User.countDocuments()) === 0 ? 'admin' : 'member';
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ success: true, token: sign(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  validate([
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password))) {
      throw new AppError('Incorrect email or password', 401);
    }
    res.json({ success: true, token: sign(user), user: publicUser(user) });
  })
);

router.get('/me', auth, (req, res) => res.json({ success: true, user: publicUser(req.user) }));

module.exports = router;
