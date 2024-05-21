const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const _ = require('lodash')
const app = require('../app')
const Blog = require('../models/blog')
const { initialBlogs, blogsInDb } = require('./test_helper')

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

  test('contains the correct fields', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach(blog => {
      assert.deepStrictEqual(_.xor(Object.keys(blog),
        ['id', 'title', 'author', 'url', 'likes']), [])
    })
  })
})

describe('POST /api/blogs', () => {
  const newBlog = {
    title: 'This is a new blog that was certainly not there before',
    author: 'Blog author',
    url: 'http://localhost/blog',
    likes: 1337
  }

  test('response status is 201 and content type application/json', async () => {
    await api.post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  test('increases the number of blogs', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.post('/api/blogs')
      .send(newBlog)
    assert.strictEqual((await blogsInDb()).length, initialNumber + 1)
  })

  test('adds the new blog to db', async () => {
    await api.post('/api/blogs')
      .send(newBlog)
    const createdBlog = (await blogsInDb())
      .find(blog => blog.title === newBlog.title)
    assert.notEqual(createdBlog, undefined)
    assert.strictEqual(createdBlog.title, newBlog.title)
    assert.strictEqual(createdBlog.author, newBlog.author)
    assert.strictEqual(createdBlog.url, newBlog.url)
    assert.strictEqual(createdBlog.likes, newBlog.likes)
  })

  test('returns the created blog with an id', async () => {
    const createdBlog = (await api.post('/api/blogs')
      .send(newBlog)).body
    assert.strictEqual(createdBlog.title, newBlog.title)
    assert.strictEqual(createdBlog.author, newBlog.author)
    assert.strictEqual(createdBlog.url, newBlog.url)
    assert.strictEqual(createdBlog.likes, newBlog.likes)
    assert.notEqual(createdBlog.id, undefined)
  })
})

after(async () => {
  await mongoose.connection.close()
})
