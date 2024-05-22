const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const _ = require('lodash')
const app = require('../app')
const User = require('../models/user')
const Blog = require('../models/blog')
const { initialUsers, usersInDb } = require('./users_test_helper')
const { initialBlogs } = require('./blogs_test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  await User.insertMany(initialUsers)
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
})

describe('GET /api/users', () => {
  test('response status is 200 and content-type application/json', async () => {
    await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns the right users', async () => {
    const response = await api.get('/api/users')
    const users = await usersInDb()
    response.body.forEach((user, i) => {
      const expected = users[i]
      assert.strictEqual(user.username, expected.username)
      assert.strictEqual(user.name, expected.name)
      assert.deepStrictEqual(user.blogs, expected.blogs)
    })
  })

  test('contains the correct fields', async () => {
    const response = await api.get('/api/users')
    response.body.forEach(user => {
      assert.deepStrictEqual(_.xor(Object.keys(user),
        ['id', 'username', 'name', 'blogs']), [])
    })
  })

  test('does not contain passwords', async () => {
    const response = await api.get('/api/users')
    response.body.forEach(user => {
      assert(!('password' in user))
      assert(!('passwordHash' in user))
    })
  })
})

describe('POST /api/users', async () => {
  const newUser = {
    username: 'newuser',
    name: 'New User',
    password: 'correct horse battery staple'
  }

  test('response status 201 and content-type application/json', async () => {
    await api.post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  test('increases the number of users', async () => {
    const initialNumber = (await usersInDb()).length
    await api.post('/api/users')
      .send(newUser)
    assert.strictEqual((await usersInDb()).length, initialNumber + 1)
  })

  test('adds the user to db', async () => {
    await api.post('/api/users')
      .send(newUser)
    const createdUser = (await usersInDb())
      .find(user => user.username === newUser.username)
    assert.notEqual(createdUser, undefined)
    assert.strictEqual(createdUser.username, newUser.username)
    assert.strictEqual(createdUser.name, newUser.name)
    assert(await bcrypt.compare(newUser.password, createdUser.passwordHash))
  })

  test('returns the created user with an id', async () => {
    const createdUser = (await api.post('/api/users')
      .send(newUser)).body
    assert.strictEqual(createdUser.username, newUser.username)
    assert.strictEqual(createdUser.name, newUser.name)
    assert.notEqual(createdUser.id, undefined)
  })

  describe('username validation', () => {
    const userMissingUsername = {
      name: 'This user was not there',
      password: 'correct horse battery staple'
    }

    test('missing username results in 400 and an error message', async () => {
      const response = await api.post('/api/users')
        .send(userMissingUsername)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      assert(response.body.error.includes('username missing'))
    })

    test('missing username does not create a new user', async () => {
      const initialNumber = (await usersInDb()).length
      await api.post('/api/users')
        .send(userMissingUsername)
      assert.strictEqual((await usersInDb()).length, initialNumber)
      const names = (await usersInDb())
        .map(user => user.name)
      assert(!names.includes(userMissingUsername.name))
    })

    const userShortUsername = { ...userMissingUsername, username: 'sh' }

    test('too short username results in 400 and an error message', async () => {
      const response = await api.post('/api/users')
        .send(userShortUsername)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      assert(response.body.error.includes('username too short'))
    })

    test('too short username does not create a new user', async () => {
      const initialNumber = (await usersInDb()).length
      await api.post('/api/users')
        .send(userShortUsername)
      assert.strictEqual((await usersInDb()).length, initialNumber)
      const usernames = (await usersInDb())
        .map(user => user.username)
      assert(!usernames.includes(userShortUsername.username))
    })

    const userDuplicateUsername = {
      ...userMissingUsername,
      username: initialUsers[0].username
    }

    test('non-unique username result in 400 and an error message', async () => {
      const response = await api.post('/api/users')
        .send(userDuplicateUsername)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      assert(response.body.error.includes('username already taken'))
    })

    test('non-unique username does not create a new user', async () => {
      const initialNumber = (await usersInDb()).length
      await api.post('/api/users')
        .send(userDuplicateUsername)
      assert.strictEqual((await usersInDb()).length, initialNumber)
      const names = (await usersInDb())
        .map(user => user.username)
      assert(!names.includes(userDuplicateUsername.name))
    })
  })

  describe('password validation', () => {
    const userMissingPassword = {
      username: 'thisuserwasnotthere',
      name: 'This user was not there'
    }

    test('missing password results in 400 and an error message', async () => {
      const response = await api.post('/api/users')
        .send(userMissingPassword)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      assert(response.body.error.includes('password missing'))
    })

    test('missing password does not create a new user', async () => {
      const initialNumber = (await usersInDb()).length
      await api.post('/api/users')
        .send(userMissingPassword)
      assert.strictEqual((await usersInDb()).length, initialNumber)
      const usernames = (await usersInDb())
        .map(user => user.username)
      assert(!usernames.includes(userMissingPassword.username))
    })

    const userShortPassword = { ...userMissingPassword, password: 'sh' }

    test('too short password results in 400 and an error message', async () => {
      const response = await api.post('/api/users')
        .send(userShortPassword)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      assert(response.body.error.includes('password too short'))
    })

    test('too short password does not create a new user', async () => {
      const initialNumber = (await usersInDb()).length
      await api.post('/api/users')
        .send(userShortPassword)
      assert.strictEqual((await usersInDb()).length, initialNumber)
      const usernames = (await usersInDb())
        .map(user => user.username)
      assert(!usernames.includes(userShortPassword.username))
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})
