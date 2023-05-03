import express from "express"
import { isAuthenticated } from "../middlewares/auth"
import { getPost, getFeed, createPost, createComment, likePost, unLikePost } from "../controllers/postController"

const router = express.Router()
router.use(isAuthenticated)
router.get("/feed", getFeed)
router.post("/create", createPost)
router.get("/:postId", getPost)
router.route("/:postId/like").post(likePost).delete(unLikePost)
router.post("/:postId/comment", createComment)

export default router
