const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const config = require('../utils/config')
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  response.json(await User.find({})
    .populate('blogs', { title: 1, author: 1, url: 1 }))
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if (!password) {
    return response.status(400)
      .json({ error: 'password missing' })
  } else if (password.length < 3) {
    return response.status(400)
      .json({ error: 'password too short' })
  }

  const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS)

  const user = await new User({ username, name, passwordHash })
    .save()
  response.status(201)
    .json(user)
})

module.exports = usersRouter
