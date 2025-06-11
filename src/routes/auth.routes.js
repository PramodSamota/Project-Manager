import { Router } from "express";
import { registerUser,loginUser,logoutUser, verifyEmail, getCurrentUser, resendEmailVerification, forgotPasswordRequest, resetForgottenPassword, changeCurrentPassword, refreshAccessToken } from "../controllers/auth.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/verify/email/:unHashedToken",verifyEmail);
router.post("/resendVerifyEmail",isLoggedIn,resendEmailVerification);
router.post("/forgot-password/:unHashedToken",forgotPasswordRequest);
router.post("/reset-password",resetForgottenPassword);
router.post("/change-password",isLoggedIn,changeCurrentPassword);
router.get("/refreshAccessToken",refreshAccessToken);
router.get("/getMe",isLoggedIn,getCurrentUser);
router.get("/logout",isLoggedIn,logoutUser);

export default router;
