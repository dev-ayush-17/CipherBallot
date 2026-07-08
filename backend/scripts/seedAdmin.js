/**
 * Seed Script — Create initial superadmin account
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if superadmin already exists
    const existing = await Admin.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('⚠️  Superadmin already exists:', existing.email);
      process.exit(0);
    }

    // Create default superadmin
    const admin = await Admin.create({
      username: 'superadmin',
      email: 'admin@cipherballot.com',
      password: 'Admin@123',
      role: 'superadmin',
    });

    console.log('✅ Superadmin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: Admin@123`);
    console.log(`   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
