// scripts/seed-users.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedUsers = [
  {
    individualId: "admin001",
    name: "Admin User",
    email: "admin@disaster.gov.lk",
    phone: "0771111111",
    role: "admin",
    password: "It8088",
    location: { lat: 6.9271, lng: 79.8612 }
  },
  {
    individualId: "responder001",
    name: "Jane Smith",
    email: "jane@emergency.gov.lk",
    phone: "0779876543",
    role: "responder",
    password: "It8088",
    location: { lat: 6.9319, lng: 79.8478 }
  },
  {
    individualId: "citizen001",
    name: "John Doe",
    email: "john@example.com",
    phone: "0771234567",
    role: "citizen",
    password: "It8088",
    location: { lat: 6.9271, lng: 79.8612 }
  }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert seed users
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.individualId} (${user.role})`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nLogin credentials:');
    console.log('=====================================');
    seedUsers.forEach(u => {
      console.log(`${u.role.toUpperCase()}: ${u.individualId} / It8088`);
    });
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
