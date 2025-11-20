const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autovolt');
    const User = require('./models/User');

    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });

    console.log('=== USER DATABASE SCAN ===');
    console.log('Total Users:', totalUsers);
    console.log('Approved Users:', approvedUsers);
    console.log('Pending Users:', pendingUsers);
    console.log('Rejected Users:', rejectedUsers);

    console.log('\n=== PENDING USERS DETAILS ===');
    const pending = await User.find({ status: 'pending' }).select('name email employeeId role createdAt');
    pending.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Employee ID: ${user.employeeId} - Role: ${user.role} - Created: ${user.createdAt}`);
    });

    console.log('\n=== ALL USERS LIST ===');
    const allUsers = await User.find({}).select('name email employeeId role status createdAt').sort({ createdAt: -1 });
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Employee ID: ${user.employeeId} - Role: ${user.role} - Status: ${user.status} - Created: ${user.createdAt}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();