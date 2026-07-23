const prisma = require('../lib/prisma');

const findUserByEmail = async (email) => {
  return prisma.$queryRawUnsafe('SELECT * FROM users WHERE email = ?', email);
};

const findUserById = async (userId) => {
  return prisma.$queryRawUnsafe('SELECT * FROM users WHERE id = ?', userId);
};

const createUser = async ({ name, email, phone, passwordHash, role, ipcId }) => {
  await prisma.$executeRawUnsafe(
    'INSERT INTO users (name, email, phone, password, role, ipc_id) VALUES (?, ?, ?, ?, ?, ?)',
    name,
    email,
    phone || null,
    passwordHash,
    role,
    ipcId || null
  );

  const [inserted] = await prisma.$queryRawUnsafe('SELECT LAST_INSERT_ID() as id');
  const [user] = await prisma.$queryRawUnsafe('SELECT * FROM users WHERE id = ?', inserted.id);
  return user;
};

const getProfileByUserId = async (userId) => {
  return prisma.$queryRawUnsafe(
    'SELECT u.id, u.name, u.email, u.phone, u.role, u.ipc_id, i.name as ipc_name, u.status, u.avatar, u.created_at FROM users u LEFT JOIN ipcs i ON u.ipc_id = i.id WHERE u.id = ?',
    userId
  );
};

const updateProfileByUserId = async (userId, { name, phone, avatar }) => {
  await prisma.$executeRawUnsafe(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar) WHERE id = ?',
    name,
    phone,
    avatar,
    userId
  );

  return prisma.$queryRawUnsafe('SELECT id, name, email, phone, role, ipc_id, avatar FROM users WHERE id = ?', userId);
};

const changePasswordByUserId = async (userId, newPasswordHash) => {
  await prisma.$executeRawUnsafe('UPDATE users SET password = ? WHERE id = ?', newPasswordHash, userId);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getProfileByUserId,
  updateProfileByUserId,
  changePasswordByUserId
};
