import { catchAsync, slugify } from "../utils"
import { prisma, storage } from "../configs"
import { UserInput, ImageInput } from "../validators"
import { sessionOptions } from "../middlewares/global"

export const getProfile = (req, res) => res.json({ data: req.user || null })

export const updateProfile = catchAsync(async (req, res) => {
  const { user } = req.session.passport
  const { id } = user
  const { username } = req.body
  
  if (username) req.body.username = slugify(username)
  // validate input
  const data = UserInput.parse(req.body)
  // update user and session
  user = await prisma.user.update({ data, where: { id } })

  res.json({ data: user })
})

export const updateAvatar = catchAsync(async (req, res) => {
  const { user } = req.session.passport
  const { id, avatar } = user

  // validate image
  const image = ImageInput(req?.files?.file)
  // upload new avatar (write/re-write)
  const filename = `avatars/${id}`
  const file = storage.file(filename)
  await file.save(image.data)
  await file.makePublic()
  // update user and session (write)
  if (!avatar) user = await prisma.user.update({ data: { avatar: file.publicUrl() }, where: { id } })

  res.json({ data: user })
})

export const deleteAvatar = catchAsync(async (req, res) => {
  const { user } = req.session.passport
  const { id, avatar } = user

  if (avatar) {
    // remove avatar
    const filename = `avatars/${id}`
    const file = storage.file(filename)
    await file.delete({ ignoreNotFound: true })
    // update user
    user = await prisma.user.update({ data: { avatar: null }, where: { id } })
  }

  res.json({ data: user })
})

export const logout = (req, res) =>
  req.session.destroy(() => {
    res.clearCookie(sessionOptions.name)
    res.json({ data: null })
  })
