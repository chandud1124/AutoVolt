const mongoose = require('mongoose');
require('dotenv').config();

async function deleteDuplicateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autovolt');
    const User = require('./models/User');

    // Users to delete
    const emailsToDelete = [
      'chandu358@gmail.com',
      'chandu3548@gmail.com'
    ];

    console.log('=== DELETING DUPLICATE USERS ===');

    for (const email of emailsToDelete) {
      const user = await User.findOne({ email });
      if (user) {
        await User.deleteOne({ email });
        console.log(`✅ Deleted user: ${user.name} (${email}) - Role: ${user.role}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    // Show remaining users
    const remainingUsers = await User.countDocuments();
    console.log(`\n=== REMAINING USERS: ${remainingUsers} ===`);

    const allUsers = await User.find({}).select('name email employeeId role createdAt').sort({ createdAt: -1 });
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Employee ID: ${user.employeeId} - Role: ${user.role} - Created: ${user.createdAt}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteDuplicateUsers();