const prisma = require('../lib/prisma');
const { generateFarmerId, generatePurchaseRef } = require('../utils/idGenerator');

const syncPush = async ({ farmers = [], purchases = [] }, user) => {
  const results = {
    farmers_synced: 0,
    purchases_synced: 0,
    errors: []
  };

  const officerUserId = user ? user.id : 1;

  for (const farmerData of farmers) {
    try {
      const [existing] = await prisma.$queryRawUnsafe('SELECT id FROM farmers WHERE nrc_id = ?', farmerData.nrc_id);
      if (!existing) {
        const farmerId = farmerData.farmer_id || (await generateFarmerId());
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
          officerUserId
        );
        results.farmers_synced++;
      }
    } catch (err) {
      results.errors.push(`Farmer '${farmerData.nrc_id}': ${err.message}`);
    }
  }

  for (const purchase of purchases) {
    try {
      const [farmerRows] = await prisma.$queryRawUnsafe('SELECT id FROM farmers WHERE id = ? OR farmer_id = ? OR nrc_id = ?', purchase.farmer_id, purchase.farmer_id, purchase.nrc_id || purchase.farmer_id);
      if (farmerRows) {
        const farmerId = farmerRows.id;
        const purchaseRef = purchase.purchase_ref || (await generatePurchaseRef());
        const [refCheck] = await prisma.$queryRawUnsafe('SELECT id FROM purchases WHERE purchase_ref = ?', purchaseRef);
        if (!refCheck) {
          const qty = parseFloat(purchase.quantity_kg);
          const price = parseFloat(purchase.unit_price);
          const total = qty * price;
          const loanRecovered = parseFloat(purchase.loan_recovered_amount || 0);
          const net = total - loanRecovered;

          await prisma.$executeRawUnsafe(
            `INSERT INTO purchases
            (purchase_ref, farmer_id, commodity_id, variety_id, grade, quantity_kg, unit_price, total_amount, loan_recovered_amount, net_payout, buying_center_ipc_id, officer_user_id, gps_latitude, gps_longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            purchaseRef,
            farmerId,
            purchase.commodity_id,
            purchase.variety_id || null,
            purchase.grade || 'Grade A',
            qty,
            price,
            total,
            loanRecovered,
            net,
            purchase.buying_center_ipc_id || (user ? user.ipc_id : 1) || 1,
            officerUserId,
            purchase.gps_latitude || null,
            purchase.gps_longitude || null
          );
          results.purchases_synced++;
        }
      }
    } catch (err) {
      results.errors.push(`Purchase '${purchase.purchase_ref}': ${err.message}`);
    }
  }

  return results;
};

const syncPull = async () => {
  const ipcs = await prisma.$queryRawUnsafe('SELECT * FROM ipcs');
  const commodities = await prisma.$queryRawUnsafe('SELECT * FROM commodities');
  const varieties = await prisma.$queryRawUnsafe('SELECT * FROM commodity_varieties');
  const clubs = await prisma.$queryRawUnsafe('SELECT * FROM clubs_associations');
  const farmers = await prisma.$queryRawUnsafe('SELECT id, farmer_id, first_name, last_name, nrc_id, phone, club_id, fingerprint_template FROM farmers WHERE status = "active"');

  return { ipcs, commodities, varieties, clubs, farmers, synced_at: new Date().toISOString() };
};

module.exports = {
  syncPush,
  syncPull
};
