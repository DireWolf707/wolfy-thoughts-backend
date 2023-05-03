import { catchAsync } from "../utils"
import { prisma, redis } from "../configs"
import { PostInput, CommentInput } from "../validators"
import { io } from "../socket"

export const getFeed = catchAsync(async (req, res) => {
  const { cursor } = req.query
  const query = {
    take: 10,
    include: {
      user: { select: { username: true, avatar: true } },
      _count: { select: { likes: { where: { userId: req.user.id } } } },
    },
    orderBy: { createdAt: "desc" },
  }
  if (cursor) {
    console.log("ehheh", cursor)
    Object.assign(query, { skip: 1, cursor: { id: cursor } })
  }

  const posts = await prisma.post.findMany(query)
  const nextCursor = posts[posts.length - 1]?.id

  res.json({ data: posts, cursor: nextCursor })
})

export const getPost = catchAsync(async (req, res) => {
  const { postId } = req.params

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    include: {
      user: { select: { username: true, avatar: true } },
      comments: {
        include: { user: { select: { username: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: { where: { userId: req.user.id } } } },
    },
  })

  res.json({ data: post })
})

export const createPost = catchAsync(async (req, res) => {
  const data = PostInput.parse(req.body)
  Object.assign(data, { userId: req.user.id })

  const post = await prisma.post.create({ data })

  const postKey = `post:${post.id}`
  await redis.hSet(postKey, { likes: 0, comments: 0 })

  res.json({ data: post })
})

export const likePost = catchAsync(async (req, res) => {
  const { postId } = req.params
  const data = { userId: req.user.id, postId: postId }

  await prisma.like.create({ data })
  // const like = await prisma.like.upsert({ where: { userId_postId: data }, create: data, update: {} })

  const postKey = `post:${postId}`
  const likes = await redis.hIncrBy(postKey, "likes", 1)
  io.in(postKey).emit("likes", { likes, postId })

  res.end()
})

export const unLikePost = catchAsync(async (req, res) => {
  const { postId } = req.params
  const data = { userId: req.user.id, postId: postId }

  await prisma.like.delete({ where: { userId_postId: data } })

  const postKey = `post:${postId}`
  const likes = await redis.hIncrBy(postKey, "likes", -1)
  io.in(postKey).emit("likes", { likes, postId })

  res.end()
})

export const createComment = catchAsync(async (req, res) => {
  const { postId } = req.params
  const data = CommentInput.parse(req.body)
  Object.assign(data, { userId: req.user.id, postId: postId })

  const comment = await prisma.comment.create({ data })

  const postKey = `post:${postId}`
  const comments = await redis.hIncrBy(postKey, "comments", 1)
  io.in(postKey).emit("comments", { comments, postId })

  res.json({ data: comment })
})
