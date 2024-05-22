const loginRouter = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const config = require('../utils/config')
const User = require('../models/user')

const authenticateUser = async (username, password) => {
  const user = await User.findOne({ username })
  if (user) {
    if (await bcrypt.compare(password, user.passwordHash)) {
      return user
    }
  } else {
    // Perform a dummy bcrypt compare to avoid revealing whether the username exists via a timing difference
    await bcrypt.compare(password, config.DUMMY_BCRYPT_HASH)
  }
  return null
}

const generateToken = user => jwt.sign({
  username: user.username,
  id: user._id
}, config.SECRET)

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body

  const authenticatedUser = await authenticateUser(username, password)
  if (!authenticatedUser) {
    return response.status(401)
      .json({ error: 'invalid username or password' })
  }

  response.status(200)
    .json({
      token: generateToken(authenticatedUser),
      username: authenticatedUser.username,
      name: authenticatedUser.name
    })
})

module.exports = loginRouter
