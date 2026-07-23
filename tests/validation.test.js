jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validateRequest } = require('../middleware/validation');
const { validationResult } = require('express-validator');

describe('validateRequest middleware', () => {
  it('passes through when validation has no errors', () => {
    const req = { body: { name: 'Ada' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const mockErrors = {
      isEmpty: () => true
    };

    validationResult.mockReturnValue(mockErrors);

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
