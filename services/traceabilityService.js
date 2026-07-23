const prisma = require('../lib/prisma');

const getTraceability = async (searchQuery) => {
  const term = searchQuery.trim();

  const purchases = await prisma.$queryRawUnsafe(
    `SELECT p.*, f.farmer_id as farmer_code, f.first_name, f.last_name, f.nrc_id, f.phone, f.gps_latitude as farmer_lat, f.gps_longitude as farmer_lng,
            c.name as club_name, com.name as commodity_name, var.variety_name, ipc.name as buying_center_ipc_name, u.name as purchasing_officer_name
     FROM purchases p
     JOIN farmers f ON p.farmer_id = f.id
     LEFT JOIN clubs_associations c ON f.club_id = c.id
     JOIN commodities com ON p.commodity_id = com.id
     LEFT JOIN commodity_varieties var ON p.variety_id = var.id
     JOIN ipcs ipc ON p.buying_center_ipc_id = ipc.id
     JOIN users u ON p.officer_user_id = u.id
     WHERE p.purchase_ref = ? OR f.farmer_id = ? OR f.nrc_id = ?`,
    term,
    term,
    term
  );

  if (purchases.length === 0) {
    const grns = await prisma.$queryRawUnsafe(
      `SELECT grn.*, w.name as warehouse_name, com.name as commodity_name, u.name as receiver_name
       FROM goods_received_notes grn
       JOIN warehouses w ON grn.warehouse_id = w.id
       JOIN commodities com ON grn.commodity_id = com.id
       JOIN users u ON grn.received_by_user_id = u.id
       WHERE grn.grn_number = ?`,
      term
    );

    if (grns.length > 0) {
      const grn = grns[0];
      let purchaseData = null;
      if (grn.purchase_id) {
        const [linkedPurchase] = await prisma.$queryRawUnsafe('SELECT * FROM purchases WHERE id = ?', grn.purchase_id);
        purchaseData = linkedPurchase || null;
      }

      return {
        mode: 'grn',
        search_term: term,
        grn_record: grn,
        linked_purchase: purchaseData
      };
    }

    return null;
  }

  const traceResults = [];
  for (const purchase of purchases) {
    const grns = await prisma.$queryRawUnsafe(
      `SELECT grn.*, w.name as warehouse_name, w.location as warehouse_location
       FROM goods_received_notes grn
       JOIN warehouses w ON grn.warehouse_id = w.id
       WHERE grn.purchase_id = ?`,
      purchase.id
    );

    const deliveries = await prisma.$queryRawUnsafe(
      `SELECT cd.*, w.name as warehouse_name
       FROM customer_deliveries cd
       JOIN warehouses w ON cd.warehouse_id = w.id
       WHERE cd.commodity_id = ? AND (cd.variety_id IS NULL OR cd.variety_id = ?)`,
      purchase.commodity_id,
      purchase.variety_id
    );

    traceResults.push({
      farmer_origin: {
        farmer_id: purchase.farmer_code,
        name: `${purchase.first_name} ${purchase.last_name}`,
        nrc_id: purchase.nrc_id,
        phone: purchase.phone,
        club_name: purchase.club_name,
        farm_gps: {
          latitude: purchase.farmer_lat,
          longitude: purchase.farmer_lng
        }
      },
      purchase_transaction: {
        purchase_ref: purchase.purchase_ref,
        commodity: purchase.commodity_name,
        variety: purchase.variety_name,
        grade: purchase.grade,
        quantity_kg: purchase.quantity_kg,
        unit_price: purchase.unit_price,
        total_amount: purchase.total_amount,
        loan_recovered: purchase.loan_recovered_amount,
        net_payout: purchase.net_payout,
        buying_center_ipc: purchase.buying_center_ipc_name,
        purchasing_officer: purchase.purchasing_officer_name,
        transaction_date: purchase.created_at
      },
      warehouse_receipts: grns.map(g => ({
        grn_number: g.grn_number,
        warehouse_name: g.warehouse_name,
        warehouse_location: g.warehouse_location,
        quantity_received_kg: g.quantity_received_kg,
        grade: g.grade,
        receipt_date: g.created_at
      })),
      customer_deliveries: deliveries.map(d => ({
        delivery_ref: d.delivery_ref,
        customer_name: d.customer_name,
        warehouse_source: d.warehouse_name,
        quantity_kg: d.quantity_kg,
        dispatch_date: d.dispatch_date
      }))
    });
  }

  return { mode: 'purchase', traceResults };
};

module.exports = {
  getTraceability
};
