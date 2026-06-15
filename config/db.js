const mongoose = require("mongoose");

/**
 * Establish a connection to MongoDB using the URI from environment variables.
 * Exits the process on failure so issues surface immediately during startup.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/handonme";
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
