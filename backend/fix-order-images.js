const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mealbox')
    .then(async () => {
        const Order = require('./models/Order');
        const Product = require('./models/Product');

        const orders = await Order.find();
        let fixed = 0;

        for (const order of orders) {
            for (const item of order.items) {
                // Check if it's a short ID (MongoDB ObjectId is ~24 chars) AND there's a product reference
                if (item.image && item.image.length === 24 && item.product && !item.image.startsWith('/uploads')) {
                    try {
                        const product = await Product.findById(item.product);
                        if (product && product.images && product.images[0]) {
                            item.image = product.images[0].url;
                            await order.save();
                            console.log(`Fixed: ${item.name} -> ${item.image}`);
                            fixed++;
                        }
                    } catch (e) {
                        console.log('Error:', e.message);
                    }
                }
            }
        }

        console.log(`Fixed ${fixed} items`);
        process.exit(0);
    });