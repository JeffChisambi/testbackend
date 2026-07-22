const { pool, query } = require('../config/database');
const { generatePurchaseRef } = require('../utils/idGenerator');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Record a commodity purchase with automatic seed loan recovery (FR-4.1 - FR-4.11)
 */
const recordPurchase = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      farmer_id,
      commodity_id,
      variety_id,
      grade,
      quantity_kg,
      unit_price,
      buying_center_ipc_id,
      gps_latitude,
      gps_longitude,
      manual_loan_deduction
    } = req.body;

    const officer_user_id = req.user ? req.user.id : 1;

    // 1. Verify Farmer (BR-2)
    const [farmers] = await connection.execute(
      'SELECT id, farmer_id, first_name, last_name, phone FROM farmers WHERE id = ? OR farmer_id = ?',
      [farmer_id, farmer_id]
    );

    if (farmers.length === 0) {
      await connection.rollback();
      return sendError(res, 'Farmer is not registered in the system (BR-2). Registration required before recording purchases.', 404);
    }

    const farmer = farmers[0];

    // 2. Calculate Gross Amount
    const qty = parseFloat(quantity_kg);
    const price = parseFloat(unit_price);
    const total_amount = qty * price;

    // 3. Check and Calculate Seed Loan Recovery (FR-4.7, FR-4.8)
    const [activeLoans] = await connection.execute(
      'SELECT id, loan_amount, loan_balance FROM seed_loans WHERE farmer_id = ? AND status = "active" AND loan_balance > 0 ORDER BY id ASC',
      [farmer.id]
    );

    let total_loan_recovered = 0;
    let remaining_payout = total_amount;

    for (const loan of activeLoans) {
      if (remaining_payout <= 0) break;

      const currentBalance = parseFloat(loan.loan_balance);
      let deduction = 0;

      if (manual_loan_deduction !== undefined && manual_loan_deduction !== null) {
        // User provided specific recovery amount
        deduction = Math.min(parseFloat(manual_loan_deduction), currentBalance, remaining_payout);
      } else {
        // Default auto-deduction: up to 50% of purchase or total loan balance
        const maxAutoDeduction = total_amount * 0.5;
        deduction = Math.min(currentBalance, maxAutoDeduction, remaining_payout);
      }

      if (deduction > 0) {
        const newBalance = currentBalance - deduction;
        const newStatus = newBalance <= 0.01 ? 'paid' : 'active';

        await connection.execute(
          'UPDATE seed_loans SET loan_balance = ?, status = ? WHERE id = ?',
          [newBalance, newStatus, loan.id]
        );

        total_loan_recovered += deduction;
        remaining_payout -= deduction;
      }
    }

    const net_payout = total_amount - total_loan_recovered;

    // 4. Generate Unique Purchase Reference (FR-4.9)
    const purchase_ref = await generatePurchaseRef();
    const ipc_id = buying_center_ipc_id || (req.user ? req.user.ipc_id : 1) || 1;

    // 5. Insert Purchase Record
    const [purchaseResult] = await connection.execute(
      `INSERT INTO purchases 
      (purchase_ref, farmer_id, commodity_id, variety_id, grade, quantity_kg, unit_price, total_amount, loan_recovered_amount, net_payout, buying_center_ipc_id, officer_user_id, gps_latitude, gps_longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchase_ref,
        farmer.id,
        commodity_id,
        variety_id || null,
        grade || 'Grade A',
        qty,
        price,
        total_amount,
        total_loan_recovered,
        net_payout,
        ipc_id,
        officer_user_id,
        gps_latitude || null,
        gps_longitude || null
      ]
    );

    // 6. Queue SMS Notification (FR-9.2)
    const smsMessage = `NASFAM: Purchase ${purchase_ref} recorded. Qty: ${qty}KG. Gross: MWK ${total_amount.toFixed(2)}. Loan Rec: MWK ${total_loan_recovered.toFixed(2)}. Net Payout: MWK ${net_payout.toFixed(2)}. Thank you!`;

    await connection.execute(
      'INSERT INTO notifications (farmer_id, phone, message, type, status) VALUES (?, ?, ?, "purchase_receipt", "sent")',
      [farmer.id, farmer.phone, smsMessage]
    );

    await connection.commit();

    const [savedPurchase] = await query('SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, c.name as commodity_name FROM purchases p JOIN farmers f ON p.farmer_id = f.id JOIN commodities c ON p.commodity_id = c.id WHERE p.id = ?', [purchaseResult.insertId]);

    return sendSuccess(res, 'Commodity purchase recorded successfully', {
      purchase: savedPurchase[0],
      sms_notification: smsMessage
    }, 201);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * List purchases
 */
const getPurchases = async (req, res, next) => {
  try {
    const { search, farmer_id, ipc_id, commodity_id, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, f.phone, 
             com.name as commodity_name, var.variety_name, ipc.name as ipc_name, u.name as officer_name 
      FROM purchases p 
      JOIN farmers f ON p.farmer_id = f.id 
      JOIN commodities com ON p.commodity_id = com.id 
      LEFT JOIN commodity_varieties var ON p.variety_id = var.id 
      JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id 
      JOIN users u ON p.officer_user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.purchase_ref LIKE ? OR f.farmer_id LIKE ? OR f.first_name LIKE ? OR f.last_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (farmer_id) {
      sql += ` AND (p.farmer_id = ? OR f.farmer_id = ?)`;
      params.push(farmer_id, farmer_id);
    }

    if (ipc_id) {
      sql += ` AND p.buying_center_ipc_id = ?`;
      params.push(ipc_id);
    }

    if (commodity_id) {
      sql += ` AND p.commodity_id = ?`;
      params.push(commodity_id);
    }

    sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), offset);

    const [purchases] = await query(sql, params);

    return sendSuccess(res, 'Purchases retrieved successfully', purchases);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Purchase details by reference
 */
const getPurchaseByRef = async (req, res, next) => {
  try {
    const { ref } = req.params;

    const [purchases] = await query(
      `SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, f.phone, f.nrc_id,
              com.name as commodity_name, var.variety_name, ipc.name as ipc_name, u.name as officer_name 
       FROM purchases p 
       JOIN farmers f ON p.farmer_id = f.id 
       JOIN commodities com ON p.commodity_id = com.id 
       LEFT JOIN commodity_varieties var ON p.variety_id = var.id 
       JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id 
       JOIN users u ON p.officer_user_id = u.id 
       WHERE p.purchase_ref = ? OR p.id = ?`,
      [ref, ref]
    );

    if (purchases.length === 0) {
      return sendError(res, 'Purchase transaction record not found.', 404);
    }

    return sendSuccess(res, 'Purchase receipt details retrieved', purchases[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordPurchase,
  getPurchases,
  getPurchaseByRef
};
