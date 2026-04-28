const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mealbox')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Find all users who have referred someone (referredBy field is set)
    const referredUsers = await User.find({ referredBy: { $ne: null } });
    
    console.log(`Found ${referredUsers.length} users who were referred`);
    
    for (const user of referredUsers) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        console.log(`\nUser: ${user.email}`);
        console.log(`  Referred by: ${referrer.email}`);
        console.log(`  Referrer's current rewards earned: ₹${referrer.referralRewardsEarned}`);
        
        if (referrer.referralRewardsEarned === 0) {
          // Give reward manually
          referrer.referralCount += 1;
          referrer.referralRewardsEarned += 50;
          referrer.referralRewardsUsed += 50;
          await referrer.save();
          console.log(`  ✅ GAVE ₹50 REWARD!`);
        } else {
          console.log(`  ⚠️ Already has rewards - skipping`);
        }
      }
    }
    
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });