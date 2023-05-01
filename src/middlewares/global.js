import cors from "cors"
import morgan from "morgan"
import fileupload from "express-fileupload"
import session from "express-session"
import RedisStore from "connect-redis"
import { redis } from "../configs"

export const corsOptions = {
  origin: [process.env.CLIENT_URL, "https://studio.apollographql.com"],
  credentials: true,
}

export const corsMiddleware = cors(corsOptions)

export const morganMiddleware = () => {
  if (process.env.NODE_ENV === "production") return morgan("short")
  return morgan("dev")
}

export const fileuploadMiddleware = fileupload({
  useTempFiles: false,
  // tempFileDir: "/tmp/",
})

export const sessionOptions = {
  name: "session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  rolling: false,
  saveUninitialized: false,
  store: new RedisStore({
    client: redis,
    prefix: "session:",
  }),
  unset: "destroy",
  cookie: {
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}

export const sessionMiddleware = session(sessionOptions)
