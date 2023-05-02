import { catchAsync } from "../utils"
import { prisma, redis } from "../configs"
import { PostInput, CommentInput } from "../validators"
import { io } from "../socket"

const user = await prisma.user.findFirst()

export const getPostFeed = catchAsync(async (req, res) => {
  const { cursor } = req.body

  const query = {
    take: 10,
    include: {
      user: { select: { username: true, avatar: true } },
      _count: { select: { likes: { where: { userId: user.id } } } },
    },
    orderBy: { createdAt: "desc" },
  }
  if (cursor) Object.assign(query, { skip: 1, cursor: { id: cursor } })
  const posts = await prisma.post.findMany(query)

  const nextCursor = posts[posts.length - 1].id
  res.json({ data: posts, cursor: nextCursor })
})

export const createPost = catchAsync(async (req, res) => {
  const data = PostInput.parse(req.body)
  Object.assign(data, { userId: user.id })
  const post = await prisma.post.create({ data })

  const postKey = `post:${post.id}`
  await redis.hSet(postKey, { likes: 0, comments: 0 })

  res.json({ data: post })
})

export const likePost = catchAsync(async (req, res) => {
  const { postId } = req.params

  const data = { userId: user.id, postId: postId }
  const like = await prisma.like.create({ data })
  // const like = await prisma.like.upsert({ where: { userId_postId: data }, create: data, update: {} })

  const postKey = `post:${postId}`
  const likes = await redis.hIncrBy(postKey, "likes", 1)
  io.in(postKey).emit("likes", likes)

  res.json({ data: like })
})

export const unLikePost = catchAsync(async (req, res) => {
  const { postId } = req.params

  const data = { userId: user.id, postId: postId }
  const like = await prisma.like.delete({ where: { userId_postId: data } })

  const postKey = `post:${postId}`
  const likes = await redis.hIncrBy(postKey, "likes", -1)
  io.in(postKey).emit("likes", likes)

  res.end()
})

export const createComment = catchAsync(async (req, res) => {
  const { postId } = req.params
  const data = CommentInput.parse({
    content: "heheheh comment",
  })
  Object.assign(data, { userId: user.id, postId: postId })
  const comment = await prisma.comment.create({ data })

  const postKey = `post:${postId}`
  const comments = await redis.hIncrBy(postKey, "comments", 1)
  io.in(postKey).emit("comments", comments)

  res.end()
})
