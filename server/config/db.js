const mongoose = require('mongoose');

/**
 * Database Configuration
 * Connects to MongoDB using Mongoose
 */

const connectDB = async () => {
    try {
        // MongoDB connection string - use environment variable if available
        const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';

        // Mask password for safe logging
        const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '// $1:****@');
        console.log(`📡 Attempting to connect to: ${maskedUrl}`);

        const conn = await mongoose.connect(dbUrl, {
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
