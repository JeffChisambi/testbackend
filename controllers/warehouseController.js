const { pool, query } = require('../config/database');
const { generateGrnNumber } = require('../utils/idGenerator');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Create a new warehouse
 */
const createWarehouse = async (req, res, next) => {
  try {
    const { name, ipc_id, location, capacity_tonnes, manager_user_id } = req.body;

    const [result] = await query(
      'INSERT INTO warehouses (name, ipc_id, location, capacity_tonnes, manager_user_id) VALUES (?, ?, ?, ?, ?)',
      [name, ipc_id, location, capacity_tonnes || 1000.00, manager_user_id || null]
    );

    const [newWh] = await query('SELECT * FROM warehouses WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'Warehouse created successfully', newWh[0], 201);
  } catch (error) {
    next(error);
  }
};

/**
 * List warehouses
 */
const getWarehouses = async (req, res, next) => {
  try {
    const [warehouses] = await query(
      `SELECT w.*, ipc.name as ipc_name, u.name as manager_name 
       FROM warehouses w 
       JOIN ipcs ipc ON w.ipc_id = ipc.id 
       LEFT JOIN users u ON w.manager_user_id = u.id`
    );

    return sendSuccess(res, 'Warehouses list retrieved', warehouses);
  } catch (error) {
    next(error);
  }
};

/**
 * Receive Goods & Generate Goods Received Note (GRN) (FR-5.1, FR-5.2, FR-6.4)
 */
const receiveGoods = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { warehouse_id, purchase_id, commodity_id, variety_id, grade, quantity_received_kg, notes } = req.body;
    const received_by_user_id = req.user ? req.user.id : 1;
    const document_url = req.file ? `/uploads/${req.file.filename}` : (req.body.document_url || null);

    // 1. Generate GRN Number
    const grn_number = await generateGrnNumber();
    const qty = parseFloat(quantity_received_kg);
    const itemGrade = grade || 'Grade A';

    // 2. Insert GRN Record
    const [grnResult] = await connection.execute(
      `INSERT INTO goods_received_notes 
      (grn_number, warehouse_id, purchase_id, commodity_id, variety_id, quantity_received_kg, grade, document_url, received_by_user_id, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        grn_number,
        warehouse_id,
        purchase_id || null,
        commodity_id,
        variety_id || null,
        qty,
        itemGrade,
        document_url,
        received_by_user_id,
        notes || null
      ]
    );

    // 3. Update or Insert Inventory Stock Level (FR-6.4)
    const [existingInv] = await connection.execute(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      [warehouse_id, commodity_id, variety_id || null, itemGrade]
    );

    if (existingInv.length > 0) {
      const newQty = parseFloat(existingInv[0].quantity_kg) + qty;
      await connection.execute('UPDATE inventory SET quantity_kg = ? WHERE id = ?', [newQty, existingInv[0].id]);
    } else {
      await connection.execute(
        'INSERT INTO inventory (warehouse_id, commodity_id, variety_id, grade, quantity_kg) VALUES (?, ?, ?, ?, ?)',
        [warehouse_id, commodity_id, variety_id || null, itemGrade, qty]
      );
    }

    // 4. Record Stock Movement
    await connection.execute(
      `INSERT INTO stock_movements 
      (movement_type, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no, created_by_user_id) 
      VALUES ('receipt', ?, ?, ?, ?, ?, ?, ?)`,
      [warehouse_id, commodity_id, variety_id || null, itemGrade, qty, grn_number, received_by_user_id]
    );

    await connection.commit();

    const [grnRecord] = await query('SELECT grn.*, w.name as warehouse_name, com.name as commodity_name FROM goods_received_notes grn JOIN warehouses w ON grn.warehouse_id = w.id JOIN commodities com ON grn.commodity_id = com.id WHERE grn.id = ?', [grnResult.insertId]);

    return sendSuccess(res, 'Goods received and GRN generated successfully', grnRecord[0], 201);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Transfer Stock between warehouses (FR-5.6, BR-5)
 */
const transferStock = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { source_warehouse_id, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no } = req.body;
    const created_by_user_id = req.user ? req.user.id : 1;
    const qty = parseFloat(quantity_kg);
    const itemGrade = grade || 'Grade A';

    // 1. Check Source Warehouse Inventory & Prevent Negative Balance (BR-5)
    const [sourceInv] = await connection.execute(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      [source_warehouse_id, commodity_id, variety_id || null, itemGrade]
    );

    if (sourceInv.length === 0 || parseFloat(sourceInv[0].quantity_kg) < qty) {
      await connection.rollback();
      const currentStock = sourceInv.length > 0 ? sourceInv[0].quantity_kg : 0;
      return sendError(res, `Cannot transfer stock. Insufficient inventory in source warehouse. Available: ${currentStock} KG, Requested: ${qty} KG (BR-5).`, 400);
    }

    // 2. Deduct from Source Warehouse
    const newSourceQty = parseFloat(sourceInv[0].quantity_kg) - qty;
    await connection.execute('UPDATE inventory SET quantity_kg = ? WHERE id = ?', [newSourceQty, sourceInv[0].id]);

    // 3. Add to Destination Warehouse
    const [destInv] = await connection.execute(
      'SELECT id, quantity_kg FROM inventory WHERE warehouse_id = ? AND commodity_id = ? AND COALESCE(variety_id, 0) = COALESCE(?, 0) AND grade = ?',
      [dest_warehouse_id, commodity_id, variety_id || null, itemGrade]
    );

    if (destInv.length > 0) {
      const newDestQty = parseFloat(destInv[0].quantity_kg) + qty;
      await connection.execute('UPDATE inventory SET quantity_kg = ? WHERE id = ?', [newDestQty, destInv[0].id]);
    } else {
      await connection.execute(
        'INSERT INTO inventory (warehouse_id, commodity_id, variety_id, grade, quantity_kg) VALUES (?, ?, ?, ?, ?)',
        [dest_warehouse_id, commodity_id, variety_id || null, itemGrade, qty]
      );
    }

    // 4. Record Stock Movement
    const ref = reference_no || `TRF-${Date.now()}`;
    await connection.execute(
      `INSERT INTO stock_movements 
      (movement_type, source_warehouse_id, dest_warehouse_id, commodity_id, variety_id, grade, quantity_kg, reference_no, created_by_user_id) 
      VALUES ('transfer_out', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [source_warehouse_id, dest_warehouse_id, commodity_id, variety_id || null, itemGrade, qty, ref, created_by_user_id]
    );

    await connection.commit();

    return sendSuccess(res, 'Stock transfer completed successfully', {
      reference_no: ref,
      transferred_kg: qty
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  receiveGoods,
  transferStock
};
