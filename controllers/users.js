const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const config = require('../utils/config')
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  response.json(await User.find({}))
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body
  const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS)

  const user = await new User({ username, name, passwordHash })
    .save()
  response.status(201)
    .json(user)
})

module.exports = usersRouter
