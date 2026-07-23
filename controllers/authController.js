const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  findUserByEmail,
  findUserById,
  createUser,
  getProfileByUserId,
  updateProfileByUserId,
  changePasswordByUserId
} = require('../services/authService');

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

    const existing = await findUserByEmail(email);
    if (existing && existing.length > 0) {
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

    const createdUser = await createUser({
      name,
      email,
      phone,
      passwordHash: hashedPassword,
      role: userRole,
      ipcId: ipc_id
    });

    const newUser = { id: createdUser.id, name, email, phone, role: userRole, ipc_id };
    const token = generateToken(newUser);

    return sendSuccess(res, 'User registered successfully', { user: newUser, token }, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const users = await findUserByEmail(email);
    if (!users || users.length === 0) {
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
    const users = await getProfileByUserId(req.user.id);
    if (!users || users.length === 0) {
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

    const updated = await updateProfileByUserId(userId, { name, phone, avatar });
    const updatedUser = updated && updated[0] ? updated[0] : null;

    return sendSuccess(res, 'Profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const users = await findUserById(userId);
    if (!users || users.length === 0) return sendError(res, 'User not found.', 404);

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) return sendError(res, 'Incorrect current password.', 400);

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await changePasswordByUserId(userId, newHashedPassword);

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
