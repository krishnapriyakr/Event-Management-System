import { Request, Response } from 'express';
import Registration from '../models/Registration';
import Event from '../models/Event';


//Register for an event (User only)  POST /api/registrations
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    const userId = (req as any).user.userId;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event ID'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event date has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      userId,
      eventId
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Check capacity
    const registeredCount = await Registration.countDocuments({ eventId });
    if (registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Create registration
    const registration = await Registration.create({
      userId,
      eventId
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration
    });
  } catch (error: any) {
    // Handle duplicate key error (shouldn't happen due to our check, but just in case)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register for event'
    });
  }
};

  
//  Get registrations for an event (Admin only)  GET /api/registrations?eventId=
export const getEventRegistrations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event ID'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registrations = await Registration.find({ eventId })
      .populate('userId', 'name email')
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch registrations'
    });
  }
};

    
// Get events registered by a user  GET /api/users/:id/registrations
export const getUserRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const loggedInUserId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Users can only view their own registrations
    if (userRole !== 'admin' && userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own registrations'
      });
    }

    const registrations = await Registration.find({ userId })
      .populate({
        path: 'eventId',
        populate: { path: 'createdBy', select: 'name email' }
      })
      .sort({ registeredAt: -1 });

    // Format response
    const formattedRegistrations = registrations.map(reg => ({
      id: reg._id,
      registeredAt: reg.registeredAt,
      event: reg.eventId
    }));

    res.json({
      success: true,
      count: formattedRegistrations.length,
      data: formattedRegistrations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user registrations'
    });
  }
};