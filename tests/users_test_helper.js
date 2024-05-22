const User = require('../models/user')

const initialUsers = [
  {
    username: 'root',
    name: 'Superuser',
    passwordHash: '$2a$10$sutUH5m/CSWjrfu7t5lyHuzxBwVHHqri2P8Sdi/IL0fmTq0LawDsK'
  },
  {
    username: 'user123',
    name: 'User 123',
    passwordHash: '$2a$10$ug44dgaAn5Qd0StS9ZTD8eIrTMBVuSq5cYThZnsVZjAsSLaQFVXNa'
  }
]

const usersInDb = async () =>
  (await User.find({}))
    .map(user => ({ ...user.toJSON(), passwordHash: user.passwordHash }))

module.exports = {
  initialUsers,
  usersInDb
}
