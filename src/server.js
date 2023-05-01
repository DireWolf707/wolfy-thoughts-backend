// Global Exception Handler
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...")
  console.error(err.name, err.message)
  if (process.env.NODE_ENV === "production") process.exit(1)
})

import "./configs"
import app from "./app"

// Server Init
const port = process.env.PORT || 3000
const server = app.listen(port, () => console.log(`App running on port ${port}...`))

// Global Promise Rejection Handler
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...")
  console.error(err.name, err.message)
  server.close(() => process.env.NODE_ENV === "production" && process.exit(1))
})

// SIGTERM Handler
process.on("SIGTERM", () => {
  console.error("SIGTERM RECEIVED! Shutting down gracefully")
  server.close(() => console.log("Process terminated!"))
})
