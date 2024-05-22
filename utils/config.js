require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI

const BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || 10

module.exports = { PORT, MONGODB_URI, BCRYPT_ROUNDS }
