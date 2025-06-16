import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.models.js";

import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../validators/env.js";
import {
  validateChangePassword,
  validateEmailData,
  validateLoginData,
  validateRegisterData,
  // validateResetPassword,
} from "../validators/auth.js";
import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} from "../utils/mail.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { handleZodError } from "../utils/handleZodError.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = handleZodError(
    validateRegisterData(req.body),
  );

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User is already exist");
  }

  const user = await User.create({
    email,
    username,
    password,
  });

  if (!user) {
    throw new ApiError(400, "user is not create");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  // avater fix;
  //upload on the cloudaniry
  await user.save();

  const verificationUrl = `${env.BASE_URI}/api/v1/user/verify/email/${unHashedToken}`;

  sendEmail(
    user.email,
    "verify email",
    emailVerificationMailgenContent(user.username, verificationUrl),
  );

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user,
        "user is Succefully register: please verify your email",
      ),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  console.log(req.params);
  const unHashedToken = req.params.unHashedToken;
  console.log("unHashedToken", unHashedToken);

  if (!unHashedToken) {
    throw new ApiError(400, "token is not geting from URL");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,

    emailVerificationExpiry: { $gt: new Date() },
  });

  console.log(user);

  if (!user) {
    throw new ApiError(404, "User is not found");
  }
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  user.isEmailVerified = true;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user, "email is verified please Login"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = handleZodError(validateLoginData(req.body));

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Crendtials are wronge ");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(400, "email is not verify ");
  }

  const verifyPassword = user.isPasswordCorrect(password);

  if (!verifyPassword) {
    throw new ApiError(401, "Crendtials are wronge ");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save();

  const cookieOption = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie("accessToken", accessToken, cookieOption);
  res.cookie("refreshToken", refreshToken, cookieOption);
  res.status(200).json(new ApiResponse(200, user, "user is succesfully login"));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  // console.log(req.body);

  const { email } = handleZodError(validateEmailData(req.body));

  if (!email) {
    throw new ApiError(400, "please provide correct email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No user found for this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "User is already verified");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  const verificationUrl = `${env.BASE_URI}/api/v1/user/verify/email/${unHashedToken}`;

  sendEmail(
    user.email,
    "verify email",
    emailVerificationMailgenContent(user.username, verificationUrl),
  );

  res
    .status(200)
    .json(new ApiResponse(200, user, "Reset eamil-veriry mail send"));
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateEmailData(req.body));

  if (!email) {
    throw new ApiError(400, "please provide correct email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No user found for this email");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  const forgotPasswordURL = `${env.BASE_URI}/api/user/forgot-password/${unHashedToken}`;

  sendEmail(
    user.email,
    "fogot Password",
    forgotPasswordMailgenContent(user.username, forgotPasswordURL),
  );

  res.status(200).json(new ApiResponse(200, user, "forgot password mail send"));
});

//this not working
const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const unHashedToken = req.params.unHashedToken;
  console.log("unHashedToken", unHashedToken);

  if (!unHashedToken) {
    throw new ApiError(400, "token is not geting from URL");
  }

  const { newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, "User not found on forgotPasswordReset");
  }

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  res
    .status(200)

    .json(new ApiResponse(200, user, " Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = handleZodError(
    validateChangePassword(req.body),
  );

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(401, "did not get userId ");
  }

  const user = await User.findOne({ _id: userId });

  if (!userId) {
    throw new ApiError(404, "user is not get");
  }

  const isPasswordMatch = user.isPasswordCorrect(oldPassword);

  if (!isPasswordMatch) {
    throw new ApiError(401, "your Old password is wronge");
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, "newPassword is set"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "refresh Token does not provided");
  }

  let decodeToken;
  try {
    decodeToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    console.log(decodeToken);
  } catch (error) {
    throw new ApiError(400, "refreshtToken is wronge", error);
  }

  const user = await User.findById(decodeToken._id);

  if (!user) {
    throw new ApiError(404, "user not found in process of refresshAccessToken");
  }
  const accessToken = user.generateAccessToken();

  const cookieOption = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie("accessToken", accessToken, cookieOption);
  res
    .status(200)
    .json(new ApiResponse(200, accessToken, "accessToken is refreshed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "user is not getting");
  }
  res.status(200).json(new ApiResponse(200, user, "user is presenetHere"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(401, "Authentication failed");
  }

  const userInfo = await User.findById(userId);

  if (!userInfo) {
    throw new ApiError(404, "Failed to get user");
  }

  // Clear the refresh token in the DB
  userInfo.refreshToken = null;
  await userInfo.save();

  // Clear the cookies on client
  res.clearCookie("accessToken");

  res.clearCookie("refreshToken");

  res
    .status(204)
    .json(new ApiResponse(204, null, "User is successfully logged out"));
});

export {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
};
