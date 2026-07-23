const prisma = require('../lib/prisma');
const { generateFarmerId } = require('../utils/idGenerator');

const findFarmerByNrc = async (nrcId) => {
  return prisma.$queryRawUnsafe('SELECT id FROM farmers WHERE nrc_id = ?', nrcId);
};

const createFarmer = async ({ farmerData, crops, registeredByUserId }) => {
  const farmerId = await generateFarmerId();

  await prisma.$executeRawUnsafe(
    `INSERT INTO farmers
    (farmer_id, first_name, last_name, nrc_id, phone, gender, date_of_birth, address, club_id, gps_latitude, gps_longitude, fingerprint_template, registered_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    farmerId,
    farmerData.first_name,
    farmerData.last_name,
    farmerData.nrc_id,
    farmerData.phone,
    farmerData.gender,
    farmerData.date_of_birth || null,
    farmerData.address || null,
    farmerData.club_id || null,
    farmerData.gps_latitude || null,
    farmerData.gps_longitude || null,
    farmerData.fingerprint_template || null,
    registeredByUserId
  );

  const [inserted] = await prisma.$queryRawUnsafe('SELECT LAST_INSERT_ID() as id');
  const farmerDbId = inserted.id;

  if (crops && Array.isArray(crops) && crops.length > 0) {
    for (const crop of crops) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO farmer_crops (farmer_id, commodity_id, variety_id, acreage_hectares, estimated_yield_kg, season) VALUES (?, ?, ?, ?, ?, ?)',
        farmerDbId,
        crop.commodity_id,
        crop.variety_id || null,
        crop.acreage_hectares || 0,
        crop.estimated_yield_kg || 0,
        crop.season || '2026'
      );
    }
  }

  const [savedFarmer] = await prisma.$queryRawUnsafe('SELECT * FROM farmers WHERE id = ?', farmerDbId);
  return { farmerDbId, farmerId, savedFarmer };
};

const listFarmers = async ({ search, clubId, page, limit }) => {
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let sql = `
    SELECT f.*, c.name as club_name, c.association_name
    FROM farmers f
    LEFT JOIN clubs_associations c ON f.club_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (f.farmer_id LIKE ? OR f.first_name LIKE ? OR f.last_name LIKE ? OR f.nrc_id LIKE ? OR f.phone LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  if (clubId) {
    sql += ` AND f.club_id = ?`;
    params.push(clubId);
  }

  sql += ` ORDER BY f.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10), offset);

  const farmers = await prisma.$queryRawUnsafe(sql, ...params);

  let countSql = `SELECT COUNT(*) as count FROM farmers f WHERE 1=1`;
  const countParams = [];

  if (search) {
    countSql += ` AND (f.farmer_id LIKE ? OR f.first_name LIKE ? OR f.last_name LIKE ? OR f.nrc_id LIKE ? OR f.phone LIKE ?)`;
    const term = `%${search}%`;
    countParams.push(term, term, term, term, term);
  }
  if (clubId) {
    countSql += ` AND f.club_id = ?`;
    countParams.push(clubId);
  }

  const [totalRows] = await prisma.$queryRawUnsafe(countSql, ...countParams);
  const total = totalRows.count;

  return { farmers, total };
};

const getFarmerDetails = async (id) => {
  const [farmer] = await prisma.$queryRawUnsafe(
    `SELECT f.*, c.name as club_name, c.association_name, u.name as registered_by_name
     FROM farmers f
     LEFT JOIN clubs_associations c ON f.club_id = c.id
     LEFT JOIN users u ON f.registered_by_user_id = u.id
     WHERE f.id = ? OR f.farmer_id = ?`,
    id,
    id
  );

  if (!farmer) {
    return null;
  }

  const crops = await prisma.$queryRawUnsafe(
    `SELECT fc.*, com.name as commodity_name, var.variety_name
     FROM farmer_crops fc
     JOIN commodities com ON fc.commodity_id = com.id
     LEFT JOIN commodity_varieties var ON fc.variety_id = var.id
     WHERE fc.farmer_id = ?`,
    farmer.id
  );

  const seedLoans = await prisma.$queryRawUnsafe(
    `SELECT sl.*, com.name as commodity_name
     FROM seed_loans sl
     JOIN commodities com ON sl.commodity_id = com.id
     WHERE sl.farmer_id = ? ORDER BY sl.id DESC`,
    farmer.id
  );

  const purchases = await prisma.$queryRawUnsafe(
    `SELECT p.*, com.name as commodity_name, ipc.name as ipc_name
     FROM purchases p
     JOIN commodities com ON p.commodity_id = com.id
     JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id
     WHERE p.farmer_id = ? ORDER BY p.id DESC`,
    farmer.id
  );

  return { farmer, crops, seedLoans, purchases };
};

const updateFarmerById = async (id, updates) => {
  const [farmer] = await prisma.$queryRawUnsafe('SELECT id FROM farmers WHERE id = ? OR farmer_id = ?', id, id);
  if (!farmer) {
    return null;
  }

  await prisma.$executeRawUnsafe(
    `UPDATE farmers SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      club_id = COALESCE(?, club_id),
      fingerprint_template = COALESCE(?, fingerprint_template),
      status = COALESCE(?, status)
    WHERE id = ?`,
    updates.first_name,
    updates.last_name,
    updates.phone,
    updates.address,
    updates.club_id,
    updates.fingerprint_template,
    updates.status,
    farmer.id
  );

  const [updated] = await prisma.$queryRawUnsafe('SELECT * FROM farmers WHERE id = ?', farmer.id);
  return updated;
};

module.exports = {
  findFarmerByNrc,
  createFarmer,
  listFarmers,
  getFarmerDetails,
  updateFarmerById
};
