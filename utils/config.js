require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI

const BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || 10
const DUMMY_BCRYPT_HASH = process.env.DUMMY_BCRYPT_HASH || '$2b$10$PdppXN9gjcs66Ck3hQ/3ZOpS7ZriE6CXTYLfGdvlIwGvlbx761iN6'

const SECRET = process.env.SECRET

module.exports = { PORT, MONGODB_URI, BCRYPT_ROUNDS, DUMMY_BCRYPT_HASH, SECRET }
