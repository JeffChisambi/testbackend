const { sendSuccess, sendError } = require('../utils/responseHandler');
const { listUsers, getUserById: getUserByIdService, updateUserById, deleteUserById } = require('../services/userService');

/**
 * Get All Users (Admin/Manager only)
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { users, total } = await listUsers({ page, limit });

    return sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User By ID
 */
const getUserByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User details retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Role/Status (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, status } = req.body;

    const updatedUser = await updateUserById(id, { name, role, status });
    if (!updatedUser) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await deleteUserById(id);
    if (!deleted) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById: getUserByIdHandler,
  updateUser,
  deleteUser
};
