const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const { initialBlogs } = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
})

describe('GET /api/blogs', () => {
  test('response status is 200 and content-type application/json', async () => {
    await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns an empty array if no blogs', async () => {
    await Blog.deleteMany({})
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, 0)
  })

  test('returns the correct number of blogs', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, initialBlogs.length)
  })

  test('returns the right blogs', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach((blog, i) => {
      const expected = initialBlogs[i]
      assert.strictEqual(blog.title, expected.title)
      assert.strictEqual(blog.author, expected.author)
      assert.strictEqual(blog.url, expected.url)
      assert.strictEqual(blog.likes, expected.likes)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
