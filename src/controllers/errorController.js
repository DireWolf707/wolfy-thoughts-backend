import { AppError } from "../utils"

const handlePayloadTooLargeError = () => new AppError("payload too large", 400)
const handleCastErrorDB = () => new AppError("invalid data", 400)
const handleNotFoundErrorDB = () => new AppError("record to update not found", 400)
const handleLongValueErrorDB = () => new AppError("data too long", 400)
const handleUniqueConstraintErrorDB = (err) => {
  const errors = err.meta.target.map((field) => `${field}:${field} is already in use`)
  const message = errors.join(",")
  return new AppError(message, 400)
}
const handleValidationError = (err) => {
  const errors = err.issues.map(({ path, message }) => `${path[0]}:${message}`)
  const message = errors.join(",")
  return new AppError(message, 400)
}

export default (err, req, res, next) => {
  console.log(err)

  // express errors
  if (err.type === "entity.too.large") err = handlePayloadTooLargeError()
  // zod errors
  if (err.name === "ZodError") err = handleValidationError(err)
  // prisma errors
  if (err.code === "P2000") err = handleLongValueErrorDB()
  if (err.code === "P2002") err = handleUniqueConstraintErrorDB(err)
  if (err.code === "P2023") err = handleCastErrorDB()
  if (err.code === "P2025") err = handleNotFoundErrorDB()

  // Operational error: send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      message: err.message,
    })
  // Unknown error: don't send error details
  else
    res.status(500).json({
      message: "something went wrong",
    })
}
