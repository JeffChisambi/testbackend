const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get All Users (Admin/Manager only)
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const [users] = await query(
      'SELECT id, name, email, role, status, avatar, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [totalRows] = await query('SELECT COUNT(*) as count FROM users');
    const total = totalRows[0].count;

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
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await query('SELECT id, name, email, role, status, avatar, created_at FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User details retrieved successfully', users[0]);
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

    const [users] = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    await query(
      'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?',
      [name, role, status, id]
    );

    const [updatedUsers] = await query('SELECT id, name, email, role, status, avatar FROM users WHERE id = ?', [id]);

    return sendSuccess(res, 'User updated successfully', updatedUsers[0]);
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

    const [users] = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
