const mongoose = require('mongoose');

/**
 * Database Configuration
 * Connects to MongoDB using Mongoose
 */

const connectDB = async () => {
    try {
        // MongoDB connection string - using local MongoDB instance
        const conn = await mongoose.connect('mongodb://localhost:27017/skillswap', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
