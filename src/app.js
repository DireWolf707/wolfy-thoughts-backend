import express from "express"
import passport from "passport"
import helmet from "helmet"
import compression from "compression"
import errorController from "./controllers/errorController"
import { AppError } from "./utils"
import { userRouter, postRouter } from "./routers"
import { corsMiddleware, morganMiddleware, fileuploadMiddleware, sessionMiddleware } from "./middlewares/global"

// Express app Init
const app = express()
// Enable when runing behind a reverse proxy
app.set("trust proxy", 1)
// GLOBAL MIDDLEWARES
// Compression
app.use(compression())
// Cors
app.use(corsMiddleware)
// Enable when serving static files
// app.use(express.static(path.join(__dirname, "public")))
app.use(helmet()) // Set security HTTP headers
// Logging
app.use(morganMiddleware())
// Body parser
app.use(express.json({ limit: "10kb" })) // for json data
// app.use(express.urlencoded({ extended: true, limit: "10kb" })) // for html form data
// File upload
app.use(fileuploadMiddleware)
// Session
app.use(sessionMiddleware)
// Passport
app.use(passport.initialize())
app.use(passport.session())
// Custom middlewares: app.use((req, res, next) => {next()})
// Routes
app.get("/", (req, res, next) => res.json("DireWolf!"))
app.use("/user", userRouter)
app.use("/post", postRouter)
// 404 Handler
app.all("*", (req, res, next) => next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)))
// Error Handler
app.use(errorController)

export default app
