const jwt = require('jsonwebtoken')

const config = require('./config')
const logger = require('./logger')
const User = require('../models/user')

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  }
  next()
}

const userExtractor = async (request, response, next) => {
  if (!request.token) {
    return response.status(401)
      .json({ error: 'authentication token missing' })
      .end()
  }

  const decodedToken = jwt.verify(request.token, config.SECRET)
  if (!decodedToken.id) {
    return response.status(401)
      .json({ error: 'token invalid' })
      .end()
  }

  const user = await User.findById(decodedToken.id)
  if (!user) {
    return response.status(401)
      .json({ error: 'user associated to token not found' })
      .end()
  }

  request.user = user
  next()
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400)
      .json({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    response.status(400)

    if (error.errors?.username) {
      const { kind } = error.errors.username
      if (kind === 'minlength') {
        return response.json({ error: 'username too short' })
      } else if (kind === 'required') {
        return response.json({ error: 'username missing' })
      }
    }

    return response.json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    return response.status(400)
      .json({ error: 'username already taken' })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401)
      .json({ error: 'token invalid' })
  }

  next(error)
}

module.exports = {
  tokenExtractor,
  userExtractor,
  errorHandler
}
