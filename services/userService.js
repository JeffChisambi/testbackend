const prisma = require('../lib/prisma');

const listUsers = async ({ page, limit }) => {
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const users = await prisma.$queryRawUnsafe(
    'SELECT id, name, email, role, status, avatar, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
    parseInt(limit, 10),
    offset
  );
  const [totalRows] = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM users');
  const total = totalRows.count;

  return { users, total };
};

const getUserById = async (id) => {
  const [user] = await prisma.$queryRawUnsafe('SELECT id, name, email, role, status, avatar, created_at FROM users WHERE id = ?', id);
  return user || null;
};

const updateUserById = async (id, { name, role, status }) => {
  const [user] = await prisma.$queryRawUnsafe('SELECT id FROM users WHERE id = ?', id);
  if (!user) {
    return null;
  }

  await prisma.$executeRawUnsafe(
    'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?',
    name,
    role,
    status,
    id
  );

  const [updatedUser] = await prisma.$queryRawUnsafe('SELECT id, name, email, role, status, avatar FROM users WHERE id = ?', id);
  return updatedUser;
};

const deleteUserById = async (id) => {
  const [user] = await prisma.$queryRawUnsafe('SELECT id FROM users WHERE id = ?', id);
  if (!user) {
    return false;
  }

  await prisma.$executeRawUnsafe('DELETE FROM users WHERE id = ?', id);
  return true;
};

module.exports = {
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById
};
