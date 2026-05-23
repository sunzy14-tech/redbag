const Joi = require('joi');
const { AppError } = require('../utils/errors');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (error) {
      return next(new AppError(error.details.map((d) => d.message).join('; '), 422, 'VALIDATION_ERROR'));
    }
    req[source] = value;
    next();
  };
}

module.exports = { Joi, validate };

