const express = require('express');
const { body, param, query } = require('express-validator');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { CONDITIONS } = Equipment;
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const withLock = require('../utils/lock');

const router = express.Router();
router.use(auth);

const MAX_DAYS = 14;
const GRACE_MS = 5 * 60 * 1000;
const idRule = param('id').isMongoId().withMessage('Invalid booking id');
const populate = [{ path: 'equipment', select: 'name category' }, { path: 'user', select: 'name' }];

const bookingRules = [
  body('equipment').isMongoId().withMessage('Choose a piece of equipment'),
  body('start').isISO8601().withMessage('Start must be a valid date and time').toDate(),
  body('end').isISO8601().withMessage('End must be a valid date and time').toDate(),
  body('purpose').optional().isString().trim().isLength({ max: 200 }).withMessage('Purpose must be under 200 characters'),
];

// Two bookings overlap when each starts before the other ends. Back-to-back (end == start) is allowed.
const findClash = (equipment, start, end) =>
  Booking.findOne({ equipment, status: 'booked', start: { $lt: end }, end: { $gt: start } }).populate('user', 'name');

const canManage = (booking, user) => user.role === 'admin' || String(booking.user) === String(user._id);

// GET /api/bookings?equipment=&status=&mine=true&from=ISO&to=ISO
router.get(
  '/',
  validate([
    query('equipment').optional().isMongoId().withMessage('Invalid equipment id'),
    query('status').optional().isIn(['booked', 'returned', 'cancelled']).withMessage('Invalid status'),
    query('from').optional().isISO8601().withMessage('from must be a date'),
    query('to').optional().isISO8601().withMessage('to must be a date'),
  ]),
  asyncHandler(async (req, res) => {
    const { equipment, status, mine, from, to } = req.query;
    const filter = {};
    if (equipment) filter.equipment = equipment;
    if (status) filter.status = status;
    if (mine === 'true') filter.user = req.user._id;
    if (from) filter.end = { $gt: new Date(from) };
    if (to) filter.start = { $lt: new Date(to) };
    const bookings = await Booking.find(filter).sort({ start: 1 }).populate(populate);
    res.json({ success: true, count: bookings.length, bookings });
  })
);

router.post(
  '/',
  validate(bookingRules),
  asyncHandler(async (req, res) => {
    const { equipment: equipmentId, start, end, purpose } = req.body;
    if (!(end > start)) throw new AppError('End must be after start', 422, [{ field: 'end', message: 'End must be after start' }]);
    if (start.getTime() < Date.now() - GRACE_MS) throw new AppError('Start time cannot be in the past', 422, [{ field: 'start', message: 'Start time cannot be in the past' }]);
    if (end - start > MAX_DAYS * 86400000) throw new AppError(`A booking can last at most ${MAX_DAYS} days`, 422, [{ field: 'end', message: `A booking can last at most ${MAX_DAYS} days` }]);

    const booking = await withLock(String(equipmentId), async () => {
      const item = await Equipment.findById(equipmentId);
      if (!item || !item.active) throw new AppError('Equipment not found', 404);
      if (item.condition === 'damaged') throw new AppError('This item is marked as damaged and cannot be booked', 409);

      const clash = await findClash(equipmentId, start, end);
      if (clash) {
        throw new AppError('This time overlaps an existing booking', 409, [
          { field: 'start', message: 'This time overlaps an existing booking', conflict: { start: clash.start, end: clash.end, by: clash.user?.name } },
        ]);
      }
      return Booking.create({ equipment: equipmentId, user: req.user._id, start, end, purpose });
    });

    await booking.populate(populate);
    res.status(201).json({ success: true, booking });
  })
);

router.patch('/:id/cancel', validate([idRule]), asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);
  if (!canManage(booking, req.user)) throw new AppError('You can only cancel your own bookings', 403);
  if (booking.status !== 'booked') throw new AppError(`This booking is already ${booking.status}`, 409);
  booking.status = 'cancelled';
  await booking.save();
  await booking.populate(populate);
  res.json({ success: true, booking });
}));

// Return equipment: records its condition on the booking and on the equipment itself
router.patch(
  '/:id/return',
  validate([
    idRule,
    body('condition').isIn(CONDITIONS).withMessage('Choose the condition of the item'),
    body('notes').optional().isString().trim().isLength({ max: 300 }).withMessage('Notes must be under 300 characters'),
  ]),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new AppError('Booking not found', 404);
    if (!canManage(booking, req.user)) throw new AppError('You can only return your own bookings', 403);
    if (booking.status !== 'booked') throw new AppError(`This booking is already ${booking.status}`, 409);

    booking.status = 'returned';
    booking.returnCondition = req.body.condition;
    booking.returnNotes = req.body.notes || '';
    booking.returnedAt = new Date();
    await booking.save();
    await Equipment.findByIdAndUpdate(booking.equipment, { condition: req.body.condition });
    await booking.populate(populate);
    res.json({ success: true, booking });
  })
);

module.exports = router;
