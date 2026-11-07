const AppError = require('../utils/AppError');

module.exports = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new AppError('Only an admin can do this', 403));
