import express from 'express';
import {
  registerForEvent,
  getEventRegistrations,
  getUserRegistrations
} from '../controllers/registrationController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', authorize('user', 'admin'), registerForEvent);

// Admin routes
router.get('/', authorize('admin'), getEventRegistrations);

// User registrations (users can view their own, admins can view any)
router.get('/user/:id', getUserRegistrations);

export default router;