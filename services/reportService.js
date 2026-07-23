const prisma = require('../lib/prisma');

const getFarmerReport = async () => {
  const [totalFarmers] = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM farmers');
  const byGender = await prisma.$queryRawUnsafe('SELECT gender, COUNT(*) as count FROM farmers GROUP BY gender');
  const byClub = await prisma.$queryRawUnsafe(
    `SELECT c.name as club_name, COUNT(f.id) as count
     FROM farmers f
     JOIN clubs_associations c ON f.club_id = c.id
     GROUP BY c.id ORDER BY count DESC`
  );

  return {
    total_farmers: totalFarmers.total,
    by_gender: byGender,
    by_club: byClub
  };
};

const getPurchaseReport = async ({ startDate, endDate, ipcId, commodityId }) => {
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

  if (startDate) {
    sql += ` AND DATE(p.created_at) >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND DATE(p.created_at) <= ?`;
    params.push(endDate);
  }
  if (ipcId) {
    sql += ` AND p.buying_center_ipc_id = ?`;
    params.push(ipcId);
  }
  if (commodityId) {
    sql += ` AND p.commodity_id = ?`;
    params.push(commodityId);
  }

  sql += ` GROUP BY p.buying_center_ipc_id, p.commodity_id`;

  return prisma.$queryRawUnsafe(sql, ...params);
};

const getLoanRecoveryReport = async () => {
  return prisma.$queryRawUnsafe(
    `SELECT com.name as commodity_name,
            COUNT(sl.id) as total_loans,
            SUM(sl.loan_amount) as total_issued_mwk,
            SUM(sl.loan_amount - sl.loan_balance) as total_recovered_mwk,
            SUM(sl.loan_balance) as outstanding_balance_mwk
     FROM seed_loans sl
     JOIN commodities com ON sl.commodity_id = com.id
     GROUP BY sl.commodity_id`
  );
};

module.exports = {
  getFarmerReport,
  getPurchaseReport,
  getLoanRecoveryReport
};
