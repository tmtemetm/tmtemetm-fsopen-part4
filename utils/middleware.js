const logger = require('./logger')

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
  errorHandler
}
