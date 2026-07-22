const { query } = require('../config/database');
const { sendSuccess } = require('../utils/responseHandler');

/**
 * Farmer Summary Report (FR-8.1)
 */
const getFarmerReport = async (req, res, next) => {
  try {
    const [totalFarmers] = await query('SELECT COUNT(*) as total FROM farmers');
    const [byGender] = await query('SELECT gender, COUNT(*) as count FROM farmers GROUP BY gender');
    const [byClub] = await query(
      `SELECT c.name as club_name, COUNT(f.id) as count 
       FROM farmers f 
       JOIN clubs_associations c ON f.club_id = c.id 
       GROUP BY c.id ORDER BY count DESC`
    );

    return sendSuccess(res, 'Farmer summary report generated', {
      total_farmers: totalFarmers[0].total,
      by_gender: byGender,
      by_club: byClub
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Purchase Analytics Report (FR-8.2)
 */
const getPurchaseReport = async (req, res, next) => {
  try {
    const { start_date, end_date, ipc_id, commodity_id } = req.query;

    let sql = `
      SELECT p.buying_center_ipc_id, ipc.name as ipc_name, com.name as commodity_name,
             COUNT(p.id) as total_transactions,
             SUM(p.quantity_kg) as total_quantity_kg,
             SUM(p.total_amount) as gross_amount_mwk,
             SUM(p.loan_recovered_amount) as total_loan_recovered_mwk,
             SUM(p.net_payout) as net_payout_mwk
      FROM purchases p 
      JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id 
      JOIN commodities com ON p.commodity_id = com.id 
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ` AND DATE(p.created_at) >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND DATE(p.created_at) <= ?`;
      params.push(end_date);
    }
    if (ipc_id) {
      sql += ` AND p.buying_center_ipc_id = ?`;
      params.push(ipc_id);
    }
    if (commodity_id) {
      sql += ` AND p.commodity_id = ?`;
      params.push(commodity_id);
    }

    sql += ` GROUP BY p.buying_center_ipc_id, p.commodity_id`;

    const [report] = await query(sql, params);

    return sendSuccess(res, 'Purchase analytics report generated', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Seed Loan Recovery Report (FR-8.6)
 */
const getLoanRecoveryReport = async (req, res, next) => {
  try {
    const [summary] = await query(
      `SELECT com.name as commodity_name,
              COUNT(sl.id) as total_loans,
              SUM(sl.loan_amount) as total_issued_mwk,
              SUM(sl.loan_amount - sl.loan_balance) as total_recovered_mwk,
              SUM(sl.loan_balance) as outstanding_balance_mwk
       FROM seed_loans sl 
       JOIN commodities com ON sl.commodity_id = com.id 
       GROUP BY sl.commodity_id`
    );

    return sendSuccess(res, 'Seed loan recovery report generated', summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFarmerReport,
  getPurchaseReport,
  getLoanRecoveryReport
};
