import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Event from '../models/Event';
import Registration from '../models/Registration';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(' Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('👤 Admin created:', admin.email);

    // Create regular users
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user'
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'user'
    });
    console.log('👥 Users created:', user1.email, user2.email);

    // Create events
    const events = await Event.create([
      {
        title: 'Tech Conference 2026',
        description: 'Annual technology conference with industry leaders',
        date: new Date('2026-06-15T10:00:00Z'),
        location: 'Convention Center, New York',
        capacity: 100,
        createdBy: admin._id
      },
      {
        title: 'Web Development Workshop',
        description: 'Hands-on workshop on modern web development',
        date: new Date('2026-05-20T09:00:00Z'),
        location: 'Tech Hub, San Francisco',
        capacity: 30,
        createdBy: admin._id
      },
      {
        title: 'AI Summit',
        description: 'Exploring the future of artificial intelligence',
        date: new Date('2026-07-10T11:00:00Z'),
        location: 'Innovation Center, Boston',
        capacity: 75,
        createdBy: admin._id
      },
      {
        title: 'Startup Meetup',
        description: 'Network with entrepreneurs and investors',
        date: new Date('2026-04-05T18:00:00Z'),
        location: 'Downtown Loft, Austin',
        capacity: 50,
        createdBy: admin._id
      },
      {
        title: 'Cloud Computing Workshop',
        description: 'Learn AWS, Azure, and GCP fundamentals',
        date: new Date('2026-08-22T10:00:00Z'),
        location: 'Digital Park, Seattle',
        capacity: 40,
        createdBy: admin._id
      }
    ]);
    console.log('📅 Events created:', events.length);

    // Create some registrations
    const registrations = await Registration.create([
      {
        userId: user1._id,
        eventId: events[0]._id, // Tech Conference
        registeredAt: new Date()
      },
      {
        userId: user1._id,
        eventId: events[1]._id, // Web Dev Workshop
        registeredAt: new Date()
      },
      {
        userId: user2._id,
        eventId: events[0]._id, // Tech Conference
        registeredAt: new Date()
      },
      {
        userId: user2._id,
        eventId: events[2]._id, // AI Summit
        registeredAt: new Date()
      }
    ]);
    console.log('📋 Registrations created:', registrations.length);

    console.log('\n Database seeded successfully!');
    console.log('\n Sample Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User1: john@example.com / password123');
    console.log('User2: jane@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error(' Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();