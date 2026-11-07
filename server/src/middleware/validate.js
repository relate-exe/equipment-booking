const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Usage: router.post('/', validate([...rules]), handler)
module.exports = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(new AppError(details[0].message, 422, details));
  },
];
