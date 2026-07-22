const { pool, query } = require('../config/database');
const { generateFarmerId, generatePurchaseRef } = require('../utils/idGenerator');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Mobile Offline Data Sync Push (MFR-9, MFR-10)
 */
const syncPush = async (req, res, next) => {
  const { farmers = [], purchases = [] } = req.body;
  const officer_user_id = req.user ? req.user.id : 1;

  const results = {
    farmers_synced: 0,
    purchases_synced: 0,
    errors: []
  };

  // 1. Process Offline Farmers
  for (const farmerData of farmers) {
    try {
      // Check existing NRC
      const [existing] = await query('SELECT id FROM farmers WHERE nrc_id = ?', [farmerData.nrc_id]);
      if (existing.length === 0) {
        const farmer_id = farmerData.farmer_id || (await generateFarmerId());
        await query(
          `INSERT INTO farmers 
          (farmer_id, first_name, last_name, nrc_id, phone, gender, date_of_birth, address, club_id, gps_latitude, gps_longitude, fingerprint_template, registered_by_user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            farmer_id,
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
            officer_user_id
          ]
        );
        results.farmers_synced++;
      }
    } catch (err) {
      results.errors.push(`Farmer '${farmerData.nrc_id}': ${err.message}`);
    }
  }

  // 2. Process Offline Purchases
  for (const p of purchases) {
    try {
      const [farmerRows] = await query('SELECT id FROM farmers WHERE id = ? OR farmer_id = ? OR nrc_id = ?', [p.farmer_id, p.farmer_id, p.nrc_id || p.farmer_id]);
      if (farmerRows.length > 0) {
        const farmerId = farmerRows[0].id;
        const purchase_ref = p.purchase_ref || (await generatePurchaseRef());

        const [refCheck] = await query('SELECT id FROM purchases WHERE purchase_ref = ?', [purchase_ref]);
        if (refCheck.length === 0) {
          const qty = parseFloat(p.quantity_kg);
          const price = parseFloat(p.unit_price);
          const total = qty * price;
          const loan_recovered = parseFloat(p.loan_recovered_amount || 0);
          const net = total - loan_recovered;

          await query(
            `INSERT INTO purchases 
            (purchase_ref, farmer_id, commodity_id, variety_id, grade, quantity_kg, unit_price, total_amount, loan_recovered_amount, net_payout, buying_center_ipc_id, officer_user_id, gps_latitude, gps_longitude) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              purchase_ref,
              farmerId,
              p.commodity_id,
              p.variety_id || null,
              p.grade || 'Grade A',
              qty,
              price,
              total,
              loan_recovered,
              net,
              p.buying_center_ipc_id || (req.user ? req.user.ipc_id : 1) || 1,
              officer_user_id,
              p.gps_latitude || null,
              p.gps_longitude || null
            ]
          );
          results.purchases_synced++;
        }
      }
    } catch (err) {
      results.errors.push(`Purchase '${p.purchase_ref}': ${err.message}`);
    }
  }

  return sendSuccess(res, 'Mobile offline synchronization completed', results);
};

/**
 * Mobile Offline Data Sync Pull (MFR-10)
 */
const syncPull = async (req, res, next) => {
  try {
    const [ipcs] = await query('SELECT * FROM ipcs');
    const [commodities] = await query('SELECT * FROM commodities');
    const [varieties] = await query('SELECT * FROM commodity_varieties');
    const [clubs] = await query('SELECT * FROM clubs_associations');
    const [farmers] = await query('SELECT id, farmer_id, first_name, last_name, nrc_id, phone, club_id, fingerprint_template FROM farmers WHERE status = "active"');

    return sendSuccess(res, 'Master data downloaded for offline cache', {
      ipcs,
      commodities,
      varieties,
      clubs,
      farmers,
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncPush,
  syncPull
};
