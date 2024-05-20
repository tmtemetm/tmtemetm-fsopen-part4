const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const blogsForTest = require('./blogs_for_test')

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
    assert.strictEqual(listHelper.totalLikes([blogsForTest[0]]), blogsForTest[0].likes)
  })

  test('of a list of blogs equals the sum of blogs\' likes', () => {
    assert.strictEqual(listHelper.totalLikes([
      blogsForTest[0],
      blogsForTest[1],
      blogsForTest[2]
    ]), blogsForTest[0].likes
      + blogsForTest[1].likes
      + blogsForTest[2].likes)
  })
})

describe('favorite blog', () => {
  test('of an empty list is null', () => {
    assert.strictEqual(listHelper.favoriteBlog([]), null)
  })

  test('of a single blog equals that blog', () => {
    assert.deepStrictEqual(listHelper.favoriteBlog([blogsForTest[0]]),
      blogsForTest[0])
  })

  test('of a list of blogs returns the correct blog', () => {
    assert.deepStrictEqual(listHelper.favoriteBlog(blogsForTest.slice(0, 4)),
      blogsForTest[2])
  })
})

describe('most blogs', () => {
  test('of an empty list is null', () => {
    assert.strictEqual(listHelper.mostBlogs([]), null)
  })

  test('of a single blog equals the author and count 1', () => {
    assert.deepStrictEqual(listHelper.mostBlogs([blogsForTest[0]]), {
      author: blogsForTest[0].author,
      blogs: 1
    })
  })

  test('of a list of blogs returns the correct author and count', () => {
    assert.deepStrictEqual(listHelper.mostBlogs(blogsForTest), {
      author: 'Robert C. Martin',
      blogs: 3
    })
  })
})
