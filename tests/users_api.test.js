const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const _ = require('lodash')
const app = require('../app')
const User = require('../models/user')
const { initialUsers, usersInDb } = require('./users_test_helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  await User.insertMany(initialUsers)
})

describe('GET /api/users', () => {
  test('response status is 200 and content-type application/json', async () => {
    await api.get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns the right users', async () => {
    const response = await api.get('/api/users')
    response.body.forEach((user, i) => {
      const expected = initialUsers[i]
      assert.strictEqual(user.username, expected.username)
      assert.strictEqual(user.name, expected.name)
    })
  })

  test('contains the correct fields', async () => {
    const response = await api.get('/api/users')
    response.body.forEach(user => {
      assert.deepStrictEqual(_.xor(Object.keys(user),
        ['id', 'username', 'name']), [])
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
})

after(async () => {
  await mongoose.connection.close()
})
