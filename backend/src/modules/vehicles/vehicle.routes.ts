import { Router } from 'express';
import * as controller from './vehicle.controller';
import { authenticate, requireFleetManager } from '../../middleware/authenticate';

const router = Router();

// Categories
router.get('/categories', controller.listCategories);
router.post('/categories', authenticate, requireFleetManager, controller.createCategory);

// Vehicles - public listing (authenticated for full details)
router.get('/', controller.listVehicles);
router.get('/:id', controller.getVehicle);
router.get('/:id/availability', controller.checkAvailability);

// Staff-only mutations
router.post('/', authenticate, requireFleetManager, controller.createVehicle);
router.put('/:id', authenticate, requireFleetManager, controller.updateVehicle);
router.delete('/:id', authenticate, requireFleetManager, controller.archiveVehicle);

export default router;
