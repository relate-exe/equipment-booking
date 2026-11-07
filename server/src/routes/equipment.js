const express = require('express');
const { body, param } = require('express-validator');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const { CATEGORIES, CONDITIONS } = Equipment;
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();
router.use(auth);

const rules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('category').optional().isIn(CATEGORIES).withMessage('Unknown category'),
  body('description').optional().isString().trim().isLength({ max: 300 }).withMessage('Description must be under 300 characters'),
  body('condition').optional().isIn(CONDITIONS).withMessage('Unknown condition'),
];
const idRule = param('id').isMongoId().withMessage('Invalid equipment id');
const pick = (b) =>
  Object.fromEntries(
    Object.entries({ name: b.name, category: b.category, description: b.description, condition: b.condition }).filter(([, v]) => v !== undefined)
  );

// Everyone sees the active catalogue; admins can also list retired items with ?all=true
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { active: true };
    const equipment = await Equipment.find(filter).sort({ name: 1 });
    res.json({ success: true, count: equipment.length, equipment });
  })
);

router.post('/', requireAdmin, validate(rules), asyncHandler(async (req, res) => {
  const equipment = await Equipment.create(pick(req.body));
  res.status(201).json({ success: true, equipment });
}));

router.put('/:id', requireAdmin, validate([idRule, ...rules]), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!equipment) throw new AppError('Equipment not found', 404);
  res.json({ success: true, equipment });
}));

// "Delete" retires the item so past bookings keep their history. Blocked while it has upcoming bookings.
router.delete('/:id', requireAdmin, validate([idRule]), asyncHandler(async (req, res) => {
  const open = await Booking.exists({ equipment: req.params.id, status: 'booked', end: { $gt: new Date() } });
  if (open) throw new AppError('This item has active or upcoming bookings. Cancel them first.', 409);
  const equipment = await Equipment.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!equipment) throw new AppError('Equipment not found', 404);
  res.json({ success: true, message: 'Equipment removed from the catalogue' });
}));

module.exports = router;
