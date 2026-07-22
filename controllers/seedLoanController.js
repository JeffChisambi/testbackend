const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Issue a new seed loan to a farmer (FR-3.7)
 */
const issueSeedLoan = async (req, res, next) => {
  try {
    const { farmer_id, commodity_id, loan_amount, issue_date, due_date, notes } = req.body;

    const [farmers] = await query('SELECT id FROM farmers WHERE id = ? OR farmer_id = ?', [farmer_id, farmer_id]);
    if (farmers.length === 0) {
      return sendError(res, 'Farmer record not found.', 404);
    }
    const farmerDbId = farmers[0].id;

    const loanDate = issue_date || new Date().toISOString().split('T')[0];

    const [result] = await query(
      `INSERT INTO seed_loans (farmer_id, commodity_id, loan_amount, loan_balance, issue_date, due_date, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [farmerDbId, commodity_id, loan_amount, loan_amount, loanDate, due_date || null, notes || null]
    );

    const [newLoan] = await query('SELECT * FROM seed_loans WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'Seed loan issued successfully', newLoan[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List & search seed loans
 */
const getSeedLoans = async (req, res, next) => {
  try {
    const { farmer_id, status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT sl.*, f.farmer_id as code, f.first_name, f.last_name, f.phone, com.name as commodity_name 
      FROM seed_loans sl 
      JOIN farmers f ON sl.farmer_id = f.id 
      JOIN commodities com ON sl.commodity_id = com.id 
      WHERE 1=1
    `;
    const params = [];

    if (farmer_id) {
      sql += ` AND (sl.farmer_id = ? OR f.farmer_id = ?)`;
      params.push(farmer_id, farmer_id);
    }

    if (status) {
      sql += ` AND sl.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY sl.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const [loans] = await query(sql, params);

    return sendSuccess(res, 'Seed loans list retrieved', loans);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueSeedLoan,
  getSeedLoans
};
