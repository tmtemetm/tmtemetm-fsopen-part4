const User = require('../models/user')

const initialUsers = [
  {
    _id: '664e47362a784e18e56fc1fd',
    username: 'root',
    name: 'Superuser',
    passwordHash: '$2a$10$sutUH5m/CSWjrfu7t5lyHuzxBwVHHqri2P8Sdi/IL0fmTq0LawDsK',
    blogs: [
      '5a422a851b54a676234d17f7',
      '5a422a851b54a676234d17f8'
    ]
  },
  {
    _id: '664e47362a784e18e56fc1fe',
    username: 'user123',
    name: 'User 123',
    passwordHash: '$2a$10$ug44dgaAn5Qd0StS9ZTD8eIrTMBVuSq5cYThZnsVZjAsSLaQFVXNa',
    blogs: [
      '5a422a851b54a676234d17f9',
      '5a422a851b54a676234d17fa',
      '5a422a851b54a676234d17fb',
      '5a422a851b54a676234d17fc'
    ]
  }
]

const usersInDb = async () =>
  (await User.find({})
    .populate('blogs', { title: 1, author: 1, url: 1 }))
    .map(user => ({ ...user.toJSON(), passwordHash: user.passwordHash }))

module.exports = {
  initialUsers,
  usersInDb
}
