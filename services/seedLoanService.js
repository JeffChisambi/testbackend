const prisma = require('../lib/prisma');

const issueSeedLoan = async ({ farmerId, commodityId, loanAmount, issueDate, dueDate, notes }) => {
  const [farmer] = await prisma.$queryRawUnsafe('SELECT id FROM farmers WHERE id = ? OR farmer_id = ?', farmerId, farmerId);
  if (!farmer) {
    return null;
  }

  const loanDate = issueDate || new Date().toISOString().split('T')[0];

  await prisma.$executeRawUnsafe(
    `INSERT INTO seed_loans (farmer_id, commodity_id, loan_amount, loan_balance, issue_date, due_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    farmer.id,
    commodityId,
    loanAmount,
    loanAmount,
    loanDate,
    dueDate || null,
    notes || null
  );

  const [newLoan] = await prisma.$queryRawUnsafe('SELECT * FROM seed_loans WHERE id = (SELECT LAST_INSERT_ID())');
  return newLoan;
};

const listSeedLoans = async ({ farmerId, status, page, limit }) => {
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let sql = `
    SELECT sl.*, f.farmer_id as code, f.first_name, f.last_name, f.phone, com.name as commodity_name
    FROM seed_loans sl
    JOIN farmers f ON sl.farmer_id = f.id
    JOIN commodities com ON sl.commodity_id = com.id
    WHERE 1=1
  `;
  const params = [];

  if (farmerId) {
    sql += ` AND (sl.farmer_id = ? OR f.farmer_id = ?)`;
    params.push(farmerId, farmerId);
  }

  if (status) {
    sql += ` AND sl.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY sl.id DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10), offset);

  return prisma.$queryRawUnsafe(sql, ...params);
};

module.exports = {
  issueSeedLoan,
  listSeedLoans
};
