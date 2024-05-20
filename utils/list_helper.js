const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = blogs => 1

const totalLikes = blogs =>
  blogs.reduce((likes, blog) => likes + blog.likes, 0)

const favoriteBlog = blogs =>
  blogs.reduce((favorite, blog) =>
    (!favorite || blog.likes > favorite.likes)
      ? blog
      : favorite,
  null)

const mostBlogs = blogs => {
  if (blogs.length === 0) {
    return null
  }
  const mostBlogsPair = _.maxBy(_.toPairs(_.groupBy(blogs, blog => blog.author)),
    pair => pair[1].length)
  return {
    author: mostBlogsPair[0],
    blogs: mostBlogsPair[1].length
  }
}

const mostLikes = blogs => {
  const mostLikesAccumulator = (accumulator, blogs, author) => {
    const likes = _.sumBy(blogs, blog => blog.likes)
    if (!accumulator || likes > accumulator.likes) {
      return { author, likes }
    }
    return accumulator
  }
  return _.reduce(_.groupBy(blogs, blog => blog.author), mostLikesAccumulator, null)
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
