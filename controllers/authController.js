const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'c2e8a1d7f4b3e6a9d2c5f8b1e4a7d0c3f6b9e2a5d8c1f4b7e0a3d6c9f2b5e8a1';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, ipc_id: user.ipc_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, ipc_id } = req.body;

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return sendError(res, 'User with this email already exists.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validRoles = [
      'admin', 
      'registration_officer', 
      'extension_officer', 
      'marketing_officer', 
      'warehouse_officer', 
      'ipc_manager', 
      'headoffice_manager'
    ];
    const userRole = role && validRoles.includes(role) ? role : 'registration_officer';

    const [result] = await query(
      'INSERT INTO users (name, email, phone, password, role, ipc_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, hashedPassword, userRole, ipc_id || null]
    );

    const newUser = { id: result.insertId, name, email, phone, role: userRole, ipc_id };
    const token = generateToken(newUser);

    return sendSuccess(res, 'User registered successfully', { user: newUser, token }, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return sendError(res, 'Invalid credentials provided.', 401);
    }

    const user = users[0];

    if (user.status !== 'active') {
      return sendError(res, `Account is ${user.status}. Please contact system administrator.`, 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials provided.', 401);
    }

    const token = generateToken(user);
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ipc_id: user.ipc_id,
      status: user.status,
      avatar: user.avatar
    };

    return sendSuccess(res, 'Login successful', { user: userData, token });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const [users] = await query(
      'SELECT u.id, u.name, u.email, u.phone, u.role, u.ipc_id, i.name as ipc_name, u.status, u.avatar, u.created_at FROM users u LEFT JOIN ipcs i ON u.ipc_id = i.id WHERE u.id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, 'Profile retrieved successfully', users[0]);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user.id;

    await query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar) WHERE id = ?',
      [name, phone, avatar, userId]
    );

    const [updated] = await query('SELECT id, name, email, phone, role, ipc_id, avatar FROM users WHERE id = ?', [userId]);

    return sendSuccess(res, 'Profile updated successfully', updated[0]);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [users] = await query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return sendError(res, 'User not found.', 404);

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) return sendError(res, 'Incorrect current password.', 400);

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, userId]);

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
