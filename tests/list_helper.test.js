const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const { initialBlogs } = require('./test_helper')

test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})

describe('total likes', () => {
  test('of an empty list is zero', () => {
    assert.strictEqual(listHelper.totalLikes([]), 0)
  })

  test('of a single blog equals the likes of the blog', () => {
    assert.strictEqual(listHelper.totalLikes([initialBlogs[0]]), initialBlogs[0].likes)
  })

  test('of a list of blogs equals the sum of blogs\' likes', () => {
    assert.strictEqual(listHelper.totalLikes([
      initialBlogs[0],
      initialBlogs[1],
      initialBlogs[2]
    ]), initialBlogs[0].likes
      + initialBlogs[1].likes
      + initialBlogs[2].likes)
  })
})

describe('favorite blog', () => {
  test('of an empty list is null', () => {
    assert.strictEqual(listHelper.favoriteBlog([]), null)
  })

  test('of a single blog equals that blog', () => {
    assert.deepStrictEqual(listHelper.favoriteBlog([initialBlogs[0]]),
      initialBlogs[0])
  })

  test('of a list of blogs returns the correct blog', () => {
    assert.deepStrictEqual(listHelper.favoriteBlog(initialBlogs.slice(0, 4)),
      initialBlogs[2])
  })
})

describe('most blogs', () => {
  test('of an empty list is null', () => {
    assert.strictEqual(listHelper.mostBlogs([]), null)
  })

  test('of a single blog equals the author and count 1', () => {
    assert.deepStrictEqual(listHelper.mostBlogs([initialBlogs[0]]), {
      author: initialBlogs[0].author,
      blogs: 1
    })
  })

  test('of a list of blogs returns the correct author and count', () => {
    assert.deepStrictEqual(listHelper.mostBlogs(initialBlogs), {
      author: 'Robert C. Martin',
      blogs: 3
    })
  })
})

describe('most likes', () => {
  test('of an empty list is null', () => {
    assert.strictEqual(listHelper.mostLikes([]), null)
  })

  test('of a single blog equals the author and the likes of the blog', () => {
    assert.deepStrictEqual(listHelper.mostLikes([initialBlogs[0]]), {
      author: initialBlogs[0].author,
      likes: initialBlogs[0].likes
    })
  })

  test('of a list of blogs returns the correct author and likes', () => {
    assert.deepStrictEqual(listHelper.mostLikes(initialBlogs), {
      author: 'Edsger W. Dijkstra',
      likes: 17
    })
  })
})
