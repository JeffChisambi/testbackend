const prisma = require('../lib/prisma');
const { generateGrnNumber } = require('../utils/idGenerator');

const createWarehouse = async ({ name, ipcId, location, capacityTonnes, managerUserId }) => {
  await prisma.$executeRawUnsafe(
    'INSERT INTO warehouses (name, ipc_id, location, capacity_tonnes, manager_user_id) VALUES (?, ?, ?, ?, ?)',
    name,
    ipcId,
    location,
    capacityTonnes || 1000.0,
    managerUserId || null
  );

  const [newWh] = await prisma.$queryRawUnsafe('SELECT * FROM warehouses WHERE id = (SELECT LAST_INSERT_ID())');
  return newWh;
};

const listWarehouses = async () => {
  return prisma.$queryRawUnsafe(
    `SELECT w.*, ipc.name as ipc_name, u.name as manager_name
     FROM warehouses w
     JOIN ipcs ipc ON w.ipc_id = ipc.id
     LEFT JOIN users u ON w.manager_user_id = u.id`
  );
};

const receiveGoods = async (payload, user) => {
  return prisma.$transaction(async (tx) => {
    const { warehouse_id, purchase_id, commodity_id, variety_id, grade, quantity_received_kg, notes } = payload;
    const receivedByUserId = user ? user.id : 1;
    const documentUrl = payload.document_url || null;
    const grnNumber = await generateGrnNumber();
    const qty = parseFloat(quantity_received_kg);
    const itemGrade = grade || 'Grade A';

    await tx.$executeRawUnsafe(
      `INSERT INTO goods_received_notes
      (grn_number, warehouse_id, purchase_id, commodity_id, variety_id, quantity_received_kg, grade, document_url, received_by_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      grnNumber,
      warehouse_id,
      purchase_id || null,
      commodity_id,
      variety_id || null,
      qty,
      itemGrade,
      documentUrl,
      receivedByUserId,
      notes || null
    );

    const [existingInv] = await tx.$queryRawUnsafe(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      warehouse_id,
      commodity_id,
      variety_id || null,
      itemGrade
    );

    if (existingInv) {
      const newQty = parseFloat(existingInv.quantity_kg) + qty;
      await tx.$executeRawUnsafe('UPDATE inventory SET quantity_kg = ? WHERE id = ?', newQty, existingInv.id);
    } else {
      await tx.$executeRawUnsafe(
        'INSERT INTO inventory (warehouse_id, commodity_id, variety_id, grade, quantity_kg) VALUES (?, ?, ?, ?, ?)',
        warehouse_id,
        commodity_id,
        variety_id || null,
        itemGrade,
        qty
      );
    }

    await tx.$executeRawUnsafe(
      `INSERT INTO stock_movements
      (movement_type, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no, created_by_user_id)
      VALUES ('receipt', ?, ?, ?, ?, ?, ?, ?)`,
      warehouse_id,
      commodity_id,
      variety_id || null,
      itemGrade,
      qty,
      grnNumber,
      receivedByUserId
    );

    const [grnRecord] = await tx.$queryRawUnsafe(
      'SELECT grn.*, w.name as warehouse_name, com.name as commodity_name FROM goods_received_notes grn JOIN warehouses w ON grn.warehouse_id = w.id JOIN commodities com ON grn.commodity_id = com.id WHERE grn.id = (SELECT LAST_INSERT_ID())'
    );

    return grnRecord;
  });
};

const transferStock = async (payload, user) => {
  return prisma.$transaction(async (tx) => {
    const { source_warehouse_id, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no } = payload;
    const createdByUserId = user ? user.id : 1;
    const qty = parseFloat(quantity_kg);
    const itemGrade = grade || 'Grade A';

    const [sourceInv] = await tx.$queryRawUnsafe(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      source_warehouse_id,
      commodity_id,
      variety_id || null,
      itemGrade
    );

    if (!sourceInv || parseFloat(sourceInv.quantity_kg) < qty) {
      const currentStock = sourceInv ? sourceInv.quantity_kg : 0;
      throw new Error(`Cannot transfer stock. Insufficient inventory in source warehouse. Available: ${currentStock} KG, Requested: ${qty} KG`);
    }

    const newSourceQty = parseFloat(sourceInv.quantity_kg) - qty;
    await tx.$executeRawUnsafe('UPDATE inventory SET quantity_kg = ? WHERE id = ?', newSourceQty, sourceInv.id);

    const [destInv] = await tx.$queryRawUnsafe(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      dest_warehouse_id,
      commodity_id,
      variety_id || null,
      itemGrade
    );

    if (destInv) {
      const newDestQty = parseFloat(destInv.quantity_kg) + qty;
      await tx.$executeRawUnsafe('UPDATE inventory SET quantity_kg = ? WHERE id = ?', newDestQty, destInv.id);
    } else {
      await tx.$executeRawUnsafe(
        'INSERT INTO inventory (warehouse_id, commodity_id, variety_id, grade, quantity_kg) VALUES (?, ?, ?, ?, ?)',
        dest_warehouse_id,
        commodity_id,
        variety_id || null,
        itemGrade,
        qty
      );
    }

    const ref = reference_no || `TRF-${Date.now()}`;
    await tx.$executeRawUnsafe(
      `INSERT INTO stock_movements
      (movement_type, source_warehouse_id, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no, created_by_user_id)
      VALUES ('transfer_out', ?, ?, ?, ?, ?, ?, ?, ?)`,
      source_warehouse_id,
      dest_warehouse_id,
      commodity_id,
      variety_id || null,
      itemGrade,
      qty,
      ref,
      createdByUserId
    );

    return { reference_no: ref, transferred_kg: qty };
  });
};

module.exports = {
  createWarehouse,
  listWarehouses,
  receiveGoods,
  transferStock
};
