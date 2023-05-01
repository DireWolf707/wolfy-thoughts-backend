class AppError extends Error {
  status
  statusCode
  isOperational
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // true for known errors

    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
