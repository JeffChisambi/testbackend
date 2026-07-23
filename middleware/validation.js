const { sendError } = require('../utils/responseHandler');

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, 'Validation error', 400, errors.array());
  }

  next();
};

module.exports = {
  validateRequest
};
