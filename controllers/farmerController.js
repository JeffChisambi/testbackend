const { query } = require('../config/database');
const { generateFarmerId } = require('../utils/idGenerator');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Register a new farmer (FR-3.1 - FR-3.7, MFR-2)
 */
const registerFarmer = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      nrc_id,
      phone,
      gender,
      date_of_birth,
      address,
      club_id,
      gps_latitude,
      gps_longitude,
      fingerprint_template,
      crops
    } = req.body;

    // Check duplicate NRC (FR-3.10, BR-13)
    const [existingNrc] = await query('SELECT id FROM farmers WHERE nrc_id = ?', [nrc_id]);
    if (existingNrc.length > 0) {
      return sendError(res, `A farmer with NRC/National ID '${nrc_id}' is already registered.`, 400);
    }

    // Auto-generate Farmer ID (FR-3.2, BR-1)
    const farmer_id = await generateFarmerId();
    const registered_by_user_id = req.user ? req.user.id : null;

    // Insert Farmer Record
    const [result] = await query(
      `INSERT INTO farmers 
      (farmer_id, first_name, last_name, nrc_id, phone, gender, date_of_birth, address, club_id, gps_latitude, gps_longitude, fingerprint_template, registered_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id,
        first_name,
        last_name,
        nrc_id,
        phone,
        gender,
        date_of_birth || null,
        address || null,
        club_id || null,
        gps_latitude || null,
        gps_longitude || null,
        fingerprint_template || null,
        registered_by_user_id
      ]
    );

    const farmerDbId = result.insertId;

    // Save optional crop information (FR-3.6)
    if (crops && Array.isArray(crops) && crops.length > 0) {
      for (const crop of crops) {
        await query(
          'INSERT INTO farmer_crops (farmer_id, commodity_id, variety_id, acreage_hectares, estimated_yield_kg, season) VALUES (?, ?, ?, ?, ?, ?)',
          [
            farmerDbId,
            crop.commodity_id,
            crop.variety_id || null,
            crop.acreage_hectares || 0,
            crop.estimated_yield_kg || 0,
            crop.season || '2026'
          ]
        );
      }
    }

    const [savedFarmer] = await query('SELECT * FROM farmers WHERE id = ?', [farmerDbId]);

    return sendSuccess(res, 'Farmer registered successfully', savedFarmer[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Search & List Farmers (FR-3.9)
 */
const getFarmers = async (req, res, next) => {
  try {
    const { search, club_id, page = 1, limit = 10 } = req.query;
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

    if (club_id) {
      sql += ` AND f.club_id = ?`;
      params.push(club_id);
    }

    sql += ` ORDER BY f.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const [farmers] = await query(sql, params);

    // Count Total
    let countSql = `SELECT COUNT(*) as count FROM farmers f WHERE 1=1`;
    const countParams = [];

    if (search) {
      countSql += ` AND (f.farmer_id LIKE ? OR f.first_name LIKE ? OR f.last_name LIKE ? OR f.nrc_id LIKE ? OR f.phone LIKE ?)`;
      const term = `%${search}%`;
      countParams.push(term, term, term, term, term);
    }
    if (club_id) {
      countSql += ` AND f.club_id = ?`;
      countParams.push(club_id);
    }

    const [totalRows] = await query(countSql, countParams);
    const total = totalRows[0].count;

    return sendSuccess(res, 'Farmers list retrieved successfully', {
      farmers,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Farmer Details & History (FR-3.12)
 */
const getFarmerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by numeric primary key ID or string farmer_id
    const [farmers] = await query(
      `SELECT f.*, c.name as club_name, c.association_name, u.name as registered_by_name 
       FROM farmers f 
       LEFT JOIN clubs_associations c ON f.club_id = c.id 
       LEFT JOIN users u ON f.registered_by_user_id = u.id 
       WHERE f.id = ? OR f.farmer_id = ?`,
      [id, id]
    );

    if (farmers.length === 0) {
      return sendError(res, 'Farmer record not found.', 404);
    }

    const farmer = farmers[0];

    // Fetch registered crops
    const [crops] = await query(
      `SELECT fc.*, com.name as commodity_name, var.variety_name 
       FROM farmer_crops fc 
       JOIN commodities com ON fc.commodity_id = com.id 
       LEFT JOIN commodity_varieties var ON fc.variety_id = var.id 
       WHERE fc.farmer_id = ?`,
      [farmer.id]
    );

    // Fetch seed loans
    const [seedLoans] = await query(
      `SELECT sl.*, com.name as commodity_name 
       FROM seed_loans sl 
       JOIN commodities com ON sl.commodity_id = com.id 
       WHERE sl.farmer_id = ? ORDER BY sl.id DESC`,
      [farmer.id]
    );

    // Fetch transaction history
    const [purchases] = await query(
      `SELECT p.*, com.name as commodity_name, ipc.name as ipc_name 
       FROM purchases p 
       JOIN commodities com ON p.commodity_id = com.id 
       JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id 
       WHERE p.farmer_id = ? ORDER BY p.id DESC`,
      [farmer.id]
    );

    return sendSuccess(res, 'Farmer details retrieved', {
      farmer,
      crops,
      seedLoans,
      purchases
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Farmer Information (FR-3.8)
 */
const updateFarmer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, address, club_id, fingerprint_template, status } = req.body;

    const [farmers] = await query('SELECT id FROM farmers WHERE id = ? OR farmer_id = ?', [id, id]);
    if (farmers.length === 0) {
      return sendError(res, 'Farmer record not found.', 404);
    }

    const farmerDbId = farmers[0].id;

    await query(
      `UPDATE farmers SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        club_id = COALESCE(?, club_id),
        fingerprint_template = COALESCE(?, fingerprint_template),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [first_name, last_name, phone, address, club_id, fingerprint_template, status, farmerDbId]
    );

    const [updated] = await query('SELECT * FROM farmers WHERE id = ?', [farmerDbId]);

    return sendSuccess(res, 'Farmer updated successfully', updated[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFarmer,
  getFarmers,
  getFarmerById,
  updateFarmer
};
