require('dotenv').config();

module.exports = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/teamcollab',
  jwtSecret: process.env.JWT_SECRET || 'change_me_in_prod',
};
