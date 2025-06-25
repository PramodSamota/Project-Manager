import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  getCurrentUser,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
  refreshAccessToken,
} from "../controllers/auth.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  authLimiter,
  emailsLimiter,
} from "../middlewares/rateLimiter.middlewae.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.get("/all", async (req, res) => {
  const allUsers = await User.find({});

  res.status(200).json(new ApiResponse(200, allUsers, "all data fetched"));
});
router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/verify/email/:unHashedToken", verifyEmail);
router.post(
  "/resendVerifyEmail",
  emailsLimiter,
  isLoggedIn,
  resendEmailVerification,
);
router.post("/reset-password", resetForgottenPassword);
router.post("/forgot-password/:unHashedToken", forgotPasswordRequest);
router.post("/change-password", isLoggedIn, changeCurrentPassword);
router.get("/refreshAccessToken", refreshAccessToken);
router.get("/getMe", isLoggedIn, getCurrentUser);
router.get("/logout", isLoggedIn, logoutUser);

export default router;
