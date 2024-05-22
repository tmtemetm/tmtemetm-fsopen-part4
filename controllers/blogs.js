const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')

const config = require('../utils/config')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  if (!request.token) {
    return response.status(401)
      .json({ error: 'authentication token missing' })
  }
  const decodedToken = jwt.verify(request.token, config.SECRET)
  if (!decodedToken.id) {
    return response.status(401)
      .json({ error: 'token invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const { title, author, url, likes } = request.body

  const blog = await new Blog({
    title,
    author,
    url,
    likes,
    user: user._id
  })
    .save()

  user.blogs = user.blogs.concat(blog._id)
  await user.save()

  response.status(201)
    .json(blog)
})

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const { title, author, url, likes } = request.body
  const blog = await Blog.findByIdAndUpdate(request.params.id,
    { title, author, url, likes },
    { new: true, runValidators: true, context: 'query' }
  )
    .populate('user', { username: 1, name: 1 })
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

module.exports = blogsRouter
