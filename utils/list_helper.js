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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}
