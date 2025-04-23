import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { googleLogin } from "../controllers/googleAuth.controller.js";

const router = Router();

// Register route with avatar and optional coverImage upload
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }, // optional
  ]),
  registerUser
);

// Login route
router.route("/login").post(loginUser);

// Google OAuth login
router.route("/oauth/google").post(googleLogin);

// Logout route (requires auth)
router.route("/logout").post(verifyJWT, logoutUser);

// Refresh token route
router.route("/refresh-token").post(refreshAccessToken);

// ✅ Get current authenticated user
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
