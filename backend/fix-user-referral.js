const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mealbox')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Find the user and update
    const user = await User.findOneAndUpdate(
      { email: 'hashimshaikh7276@gmail.com' },
      { 
        $set: { 
          referralCount: 1,
          referralCode: 'MEALTEST1',
          referredBy: null
        },
        $inc: { referralRewardsEarned: 0 }
      },
      { new: true, upsert: true }
    );
    
    console.log('Updated User:');
    console.log('referralCount:', user.referralCount);
    console.log('referralRewardsEarned:', user.referralRewardsEarned);
    console.log('referralCode:', user.referralCode);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });