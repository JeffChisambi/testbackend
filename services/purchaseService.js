const prisma = require('../lib/prisma');
const { generatePurchaseRef } = require('../utils/idGenerator');

const createPurchase = async (purchasePayload, user) => {
  return prisma.$transaction(async (tx) => {
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
    } = purchasePayload;

    const officerUserId = user ? user.id : 1;

    const [farmer] = await tx.$queryRawUnsafe(
      'SELECT id, farmer_id, first_name, last_name, phone FROM farmers WHERE id = ? OR farmer_id = ?',
      farmer_id,
      farmer_id
    );

    if (!farmer) {
      throw new Error('Farmer is not registered in the system');
    }

    const qty = parseFloat(quantity_kg);
    const price = parseFloat(unit_price);
    const totalAmount = qty * price;

    const activeLoans = await tx.$queryRawUnsafe(
      'SELECT id, loan_amount, loan_balance FROM seed_loans WHERE farmer_id = ? AND status = "active" AND loan_balance > 0 ORDER BY id ASC',
      farmer.id
    );

    let totalLoanRecovered = 0;
    let remainingPayout = totalAmount;

    for (const loan of activeLoans) {
      if (remainingPayout <= 0) break;

      const currentBalance = parseFloat(loan.loan_balance);
      let deduction = 0;

      if (manual_loan_deduction !== undefined && manual_loan_deduction !== null) {
        deduction = Math.min(parseFloat(manual_loan_deduction), currentBalance, remainingPayout);
      } else {
        const maxAutoDeduction = totalAmount * 0.5;
        deduction = Math.min(currentBalance, maxAutoDeduction, remainingPayout);
      }

      if (deduction > 0) {
        const newBalance = currentBalance - deduction;
        const newStatus = newBalance <= 0.01 ? 'paid' : 'active';

        await tx.$executeRawUnsafe('UPDATE seed_loans SET loan_balance = ?, status = ? WHERE id = ?', newBalance, newStatus, loan.id);
        totalLoanRecovered += deduction;
        remainingPayout -= deduction;
      }
    }

    const netPayout = totalAmount - totalLoanRecovered;
    const purchaseRef = await generatePurchaseRef();
    const ipcId = buying_center_ipc_id || (user ? user.ipc_id : 1) || 1;

    await tx.$executeRawUnsafe(
      `INSERT INTO purchases
      (purchase_ref, farmer_id, commodity_id, variety_id, grade, quantity_kg, unit_price, total_amount, loan_recovered_amount, net_payout, buying_center_ipc_id, officer_user_id, gps_latitude, gps_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      purchaseRef,
      farmer.id,
      commodity_id,
      variety_id || null,
      grade || 'Grade A',
      qty,
      price,
      totalAmount,
      totalLoanRecovered,
      netPayout,
      ipcId,
      officerUserId,
      gps_latitude || null,
      gps_longitude || null
    );

    const [insertedIdRow] = await tx.$queryRawUnsafe('SELECT LAST_INSERT_ID() as id');
    const purchaseId = insertedIdRow.id;

    const smsMessage = `NASFAM: Purchase ${purchaseRef} recorded. Qty: ${qty}KG. Gross: MWK ${totalAmount.toFixed(2)}. Loan Rec: MWK ${totalLoanRecovered.toFixed(2)}. Net Payout: MWK ${netPayout.toFixed(2)}. Thank you!`;

    await tx.$executeRawUnsafe(
      'INSERT INTO notifications (farmer_id, phone, message, type, status) VALUES (?, ?, ?, "purchase_receipt", "sent")',
      farmer.id,
      farmer.phone,
      smsMessage
    );

    const [savedPurchase] = await tx.$queryRawUnsafe(
      'SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, c.name as commodity_name FROM purchases p JOIN farmers f ON p.farmer_id = f.id JOIN commodities c ON p.commodity_id = c.id WHERE p.id = ?',
      purchaseId
    );

    return {
      purchase: savedPurchase,
      smsNotification: smsMessage
    };
  });
};

const listPurchases = async ({ search, farmerId, ipcId, commodityId, page, limit }) => {
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

  if (farmerId) {
    sql += ` AND (p.farmer_id = ? OR f.farmer_id = ?)`;
    params.push(farmerId, farmerId);
  }

  if (ipcId) {
    sql += ` AND p.buying_center_ipc_id = ?`;
    params.push(ipcId);
  }

  if (commodityId) {
    sql += ` AND p.commodity_id = ?`;
    params.push(commodityId);
  }

  sql += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10), offset);

  return prisma.$queryRawUnsafe(sql, ...params);
};

const getPurchaseByRef = async (ref) => {
  const [purchase] = await prisma.$queryRawUnsafe(
    `SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, f.phone, f.nrc_id,
            com.name as commodity_name, var.variety_name, ipc.name as ipc_name, u.name as officer_name
     FROM purchases p
     JOIN farmers f ON p.farmer_id = f.id
     JOIN commodities com ON p.commodity_id = com.id
     LEFT JOIN commodity_varieties var ON p.variety_id = var.id
     JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id
     JOIN users u ON p.officer_user_id = u.id
     WHERE p.purchase_ref = ? OR p.id = ?`,
    ref,
    ref
  );

  return purchase || null;
};

module.exports = {
  createPurchase,
  listPurchases,
  getPurchaseByRef
};
