import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} from '../controllers/eventController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/role';

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.post('/', authorize('admin'), createEvent);
router.put('/:id', authorize('admin'), updateEvent);
router.delete('/:id', authorize('admin'), deleteEvent);

// Public routes (authenticated users)
router.get('/', getEvents);
router.get('/:id', getEventById);

export default router;