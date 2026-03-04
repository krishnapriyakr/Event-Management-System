import { Request, Response } from 'express';
import Event from '../models/Event';
import Registration from '../models/Registration';

   
// Create event (Admin only)   POST /api/events
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, capacity } = req.body;
    const userId = (req as any).user.userId;

    // Validate required fields
    if (!title || !description || !date || !location || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate capacity
    if (capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be at least 1'
      });
    }

    // Validate date (cannot be in past)
    if (new Date(date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date cannot be in the past'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create event'
    });
  }
};

    
// Get all events (with pagination & search)  GET /api/events
export const getEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    
    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    // Get events
    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          registeredCount,
          availableSpots: event.capacity - registeredCount
        };
      })
    );

    res.json({
      success: true,
      data: eventsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch events'
    });
  }
};

    
// Get single event  GET /api/events/:id
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get registration count
    const registeredCount = await Registration.countDocuments({ eventId: event._id });

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        registeredCount,
        availableSpots: event.capacity - registeredCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch event'
    });
  }
};


// Update event (Admin only)   PUT /api/events/:id
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, capacity } = req.body;

    // Find event
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if capacity is being reduced below current registrations
    if (capacity) {
      const registeredCount = await Registration.countDocuments({ eventId: event._id });
      if (capacity < registeredCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity below current registrations (${registeredCount})`
        });
      }
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) {
      if (new Date(date) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Event date cannot be in the past'
        });
      }
      event.date = new Date(date);
    }
    if (location) event.location = location;
    if (capacity) {
      if (capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be at least 1'
        });
      }
      event.capacity = capacity;
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update event'
    });
  }
};


//Delete event (Admin only)  DELETE /api/events/:id
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete all registrations for this event first
    await Registration.deleteMany({ eventId: event._id });

    // Delete the event
    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event and associated registrations deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete event'
    });
  }
};