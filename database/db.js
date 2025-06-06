// const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/my_db');

// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB');
// });

// module.exports = db;

// database/db.js
// database/db.js
require("dotenv").config();
const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  // Try to read from process.env.MONGO_URI, otherwise fallback:

 if (isConnected) {
    console.log("Using existing database connection");
    return;
  }


  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/my_db";

  try {
    // In Mongoose v6+, you no longer need `useNewUrlParser` or `useUnifiedTopology`.
    const conn = await mongoose.connect(mongoUri);


    const collections = await conn.connection.db.listCollections().toArray();

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Halt the process if we cannot connect
  }
}

module.exports = connectDB;
