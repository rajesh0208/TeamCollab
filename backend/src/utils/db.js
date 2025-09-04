const mongoose = require('mongoose');
const config = require('../config/env');

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return mongoose;
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  isConnected = true;
  return mongoose;
}

module.exports = { connectToDatabase };
