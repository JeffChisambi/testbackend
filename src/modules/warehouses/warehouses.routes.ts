import { Router } from 'express';
import * as ctrl from './warehouses.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { CreateWarehouseSchema, GrnSchema, StockTransferSchema } from './warehouses.schema';

const router = Router();
router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin', 'ipc_manager'), auditLog('CREATE_WAREHOUSE', 'Warehouse'), validate(CreateWarehouseSchema), ctrl.create);
router.put('/:id', authorize('admin', 'ipc_manager'), auditLog('UPDATE_WAREHOUSE', 'Warehouse'), ctrl.update);
router.post('/grn', authorize('admin', 'ipc_manager', 'warehouse_officer'), auditLog('RECEIVE_GOODS', 'GoodsReceivedNote'), validate(GrnSchema), ctrl.receiveGoods);
router.post('/transfer', authorize('admin', 'ipc_manager', 'warehouse_officer'), auditLog('TRANSFER_STOCK', 'StockMovement'), validate(StockTransferSchema), ctrl.transferStock);

export default router;
