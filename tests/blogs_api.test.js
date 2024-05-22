const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const _ = require('lodash')

const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const { initialBlogs, blogsInDb, nonExistingId } = require('./blogs_test_helper')
const { initialUsers, usersInDb, authorizationForUser } = require('./users_test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  await User.insertMany(initialUsers)
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
    const blogs = await blogsInDb()
    response.body.forEach((blog, i) => {
      const expected = blogs[i]
      assert.strictEqual(blog.title, expected.title)
      assert.strictEqual(blog.author, expected.author)
      assert.strictEqual(blog.url, expected.url)
      assert.strictEqual(blog.likes, expected.likes)
      assert.deepStrictEqual(blog.user, expected.user)
    })
  })

  test('contains the correct fields', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach(blog => {
      assert.deepStrictEqual(_.xor(Object.keys(blog),
        ['id', 'title', 'author', 'url', 'likes', 'user']), [])
    })
  })
})

describe('POST /api/blogs', async () => {
  const authorizedUser = (await usersInDb())[1]
  const authorization = await authorizationForUser(authorizedUser.id)

  const newBlog = {
    title: 'This is a new blog that was certainly not there before',
    author: 'Blog author',
    url: 'http://localhost/blog',
    likes: 1337
  }

  test('response status is 201 and content type application/json', async () => {
    await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  test('increases the number of blogs', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(newBlog)
    assert.strictEqual((await blogsInDb()).length, initialNumber + 1)
  })

  test('adds the new blog to db', async () => {
    await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(newBlog)
    const createdBlog = (await blogsInDb())
      .find(blog => blog.title === newBlog.title)
    assert.notEqual(createdBlog, undefined)
    assert.strictEqual(createdBlog.title, newBlog.title)
    assert.strictEqual(createdBlog.author, newBlog.author)
    assert.strictEqual(createdBlog.url, newBlog.url)
    assert.strictEqual(createdBlog.likes, newBlog.likes)
    assert.strictEqual(createdBlog.user.id, authorizedUser.id)
  })

  test('returns the created blog with an id', async () => {
    const createdBlog = (await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(newBlog)).body
    assert.strictEqual(createdBlog.title, newBlog.title)
    assert.strictEqual(createdBlog.author, newBlog.author)
    assert.strictEqual(createdBlog.url, newBlog.url)
    assert.strictEqual(createdBlog.likes, newBlog.likes)
    assert.notEqual(createdBlog.id, undefined)
  })

  test('likes default to 0', async () => {
    const blogWithNoLikes = {
      title: 'This is a blog with no likes',
      author: 'Unpopular author',
      url: 'http://localhost/blog/unpopular'
    }
    const response = await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(blogWithNoLikes)
    assert.strictEqual(response.body.likes, 0)
  })

  test('missing title returns 400', async () => {
    const initialNumber = (await blogsInDb()).length
    const blogWithNoTitle = {
      author: 'Some author',
      url: 'http://localhost/no/title',
      likes: 0
    }
    await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(blogWithNoTitle)
      .expect(400)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  test('missing url returns 400', async () => {
    const initialNumber = (await blogsInDb()).length
    const blogWithNoUrl = {
      title: 'Blog title',
      author: 'Some author',
      likes: 0
    }
    await api.post('/api/blogs')
      .set('Authorization', authorization)
      .send(blogWithNoUrl)
      .expect(400)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  describe('authorization', () => {
    test('missing token results in 401', async () => {
      const blogs = await blogsInDb()
      await api.post('/api/blogs')
        .send(newBlog)
        .expect(401)
      assert.deepStrictEqual(await blogsInDb(), blogs)
    })

    test('invalid token results in 401', async () => {
      const blogs = await blogsInDb()
      await api.post('/api/blogs')
        .set('Authorization', jwt.sign({ id: '664e47362a784e18e56fc1fd', username: 'root' }, 'wrong secret'))
        .send(newBlog)
        .expect(401)
      assert.deepStrictEqual(await blogsInDb(), blogs)
    })
  })
})

describe('DELETE /api/blogs/:id', async () => {
  const blogToDelete = (await blogsInDb())[0]
  const idToDelete = blogToDelete.id
  const authorization = await authorizationForUser(blogToDelete.user.id)

  test('response status 204', async () => {
    await api.delete(`/api/blogs/${idToDelete}`)
      .set('Authorization', authorization)
      .expect(204)
  })

  test('decreases the number of blogs', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.delete(`/api/blogs/${idToDelete}`)
      .set('Authorization', authorization)
    assert.strictEqual((await blogsInDb()).length, initialNumber - 1)
  })

  test('removes the blog', async () => {
    await api.delete(`/api/blogs/${idToDelete}`)
      .set('Authorization', authorization)
    const blogIds = (await blogsInDb())
      .map(blog => blog.id)
    assert(!blogIds.includes(idToDelete))
  })

  test('nonexisting id returns 204', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.delete(`/api/blogs/${await nonExistingId()}`)
      .set('Authorization', authorization)
      .expect(204)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  test('malformatted id returns 400', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.delete('/api/blogs/x')
      .set('Authorization', authorization)
      .expect(400)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  describe('authorization', () => {
    test('missing token results in 401', async () => {
      const initialNumber = (await blogsInDb()).length
      await api.delete(`/api/blogs/${idToDelete}`)
        .expect(401)
      assert.strictEqual((await blogsInDb()).length, initialNumber)
    })

    test('invalid token results in 401', async () => {
      const initialNumber = (await blogsInDb()).length
      await api.delete(`/api/blogs/${idToDelete}`)
        .set('Authorization', jwt.sign({ id: '664e47362a784e18e56fc1fd', username: 'root' }, 'wrong secret'))
        .expect(401)
      assert.strictEqual((await blogsInDb()).length, initialNumber)
    })

    test('wrong user results in 403', async () => {
      const initialNumber = (await blogsInDb()).length
      const wrongUserId = (await usersInDb())[1].id
      await api.delete(`/api/blogs/${idToDelete}`)
        .set('Authorization', await authorizationForUser(wrongUserId))
        .expect(403)
      assert.strictEqual((await blogsInDb()).length, initialNumber)
    })
  })
})

describe('PUT /api/blogs/:id', () => {
  const updatedBlog = {
    title: 'This title is not in the database yet',
    author: 'Or this author',
    url: 'http://localhost/nor/this/url',
    likes: 110101119
  }

  test('response status 200 and Content-Type application/json', async () => {
    const id = (await blogsInDb())[0].id
    await api.put(`/api/blogs/${id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('does not create a new blog', async () => {
    const initialNumber = (await blogsInDb()).length
    const id = (await blogsInDb())[0].id
    await api.put(`/api/blogs/${id}`)
      .send(updatedBlog)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  test('updates the blog', async () => {
    const originalBlog = (await blogsInDb())[0]
    const id = originalBlog.id
    await api.put(`/api/blogs/${id}`)
      .send(updatedBlog)
    const blog = (await blogsInDb())
      .find(blog => blog.id === id)
    assert.deepStrictEqual(blog, { ...originalBlog, ...updatedBlog })
  })

  test('returns the updated blog', async () => {
    const originalBlog = (await blogsInDb())[0]
    const id = originalBlog.id
    const response = await api.put(`/api/blogs/${id}`)
      .send(updatedBlog)
    assert.deepStrictEqual(response.body, { ...originalBlog, ...updatedBlog })
  })

  test('nonexisting id returns 404', async () => {
    const initialNumber = (await blogsInDb()).length
    await api.put(`/api/blogs/${await nonExistingId()}`)
      .send(updatedBlog)
      .expect(404)
    assert.strictEqual((await blogsInDb()).length, initialNumber)
  })

  test('malformatted id returns 400', async () => {
    await api.put('/api/blogs/x')
      .send(updatedBlog)
      .expect(400)
  })
})

after(async () => {
  await mongoose.connection.close()
})
