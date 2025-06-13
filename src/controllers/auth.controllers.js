import { asyncHandler } from "../utils/async-handler.js";
import {User} from "../models/user.models.js"
import {validateChangePassword, validateEmailData, validateLoginData,validateRegisterData, validateResetPassword} from "../validators/auth.js"
import { ApiError } from "../utils/api-error.js";
import {env} from "../validators/env.js"
import {sendEmail,
       emailVerificationMailgenContent,
       forgotPasswordMailgenContent
} from "../utils/mail.js";
import { ApiResponse } from "../utils/api-response.js";

import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {

  
  const { email, username, password } = validateRegisterData(req.body).data;
    
  
  const existingUser =  await User.findOne({email});
    
  if(existingUser){
     throw new ApiError("User is already exist",400);
       }

  const user = await User.create({
    email,
    username,
    password,
  })

   if(!user){
     throw new ApiError("user is not create", 400);
   }

   const {hashedToken,unHashedToken,tokenExpiry} = user.generateTemporaryToken();

     user.emailVerificationToken= hashedToken;
     user.emailVerificationExpiry=tokenExpiry;

     // avater fix;
     //upload on the cloudaniry
     await user.save();

    const verificationUrl = `${env.BASE_URI}/api/v1/user/verify/email/${unHashedToken}`;
      
    sendEmail(
      user.email,
      "verify email",
      emailVerificationMailgenContent(user.username, verificationUrl) )
    
    res.
        status(201)
        .json(new ApiResponse(201,user,"user is Succefully register: please verify your email"))

});


const logoutUser = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
   console.log(req.user);
  if (!userId) {
    throw new ApiError("Authentication failed", 400);
  }

  const userInfo = await User.findById(userId);

  if (!userInfo) {
    throw new ApiError("Failed to get user", 400);
  }

  // Clear the refresh token in the DB
  userInfo.refreshToken = null;
  await userInfo.save();

  // Clear the cookies on client
  res.clearCookie("accessToken");

  res.clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, null, "User is successfully logged out"));
});

const verifyEmail = asyncHandler(async (req, res) => {

   console.log(req.params);
  const unHashedToken= req.params.unHashedToken;
  console.log("unHashedToken",unHashedToken);

  if(!unHashedToken){
    throw new ApiError("token is not geting from URL",400);
  }

  const hashedToken = crypto
                      .createHash("sha256")
                      .update(unHashedToken)
                      .digest("hex");

          console.log(typeof hashedToken);

  const user = await User.findOne({
          emailVerificationToken:new mongoose.Types.ObjectId(hashedToken),
          emailVerificationExpiry:{$gt: new Date()}                     
  })

       console.log(user);

  if(!user){
    throw new ApiError("email is not verified",400);
  }
     user.emailVerificationToken=undefined;
     user.emailVerificationExpiry=undefined;
     user.isEmailVerified=true;

     await user.save();

     res.status(200).json(new ApiResponse(200,user, "email is verified please Login"))
});


const loginUser = asyncHandler(async (req, res) => {
    
  const { email, password } = validateLoginData(req.body).data;

  const user = await User.findOne({email});

  if(!user){
    throw new ApiError("Crendtials are wronge ",400);
  }

  if(!user.isEmailVerified){
    throw new ApiError("email is not verify ",400);
  }

  const verifyPassword = user.isPasswordCorrect(password);

  if(!verifyPassword){
    throw new ApiError("Crendtials are wronge ",400);
  }
  

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  user.refreshToken=refreshToken;


  await user.save();

  const cookieOption = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

  res.cookie("accessToken",accessToken,cookieOption)
   res.cookie("refreshToken",refreshToken,cookieOption)
    res.status(200).json(new ApiResponse(200,user,"user is succesfully login"));
   
});

const resendEmailVerification = asyncHandler(async (req, res) => {
 
  // console.log(req.body);
    const {email} = validateEmailData(req.body).data;

    if(!email){
      throw new ApiError("please provide correct email",400);
    }
     
    const user = await User.findOne({email});

    // i am avoiding this command right now bcz i want to continue;
    // if(user.isEmailVerified){

    // }

    if(!user){
      throw new ApiError("No user found for this email",400);
    }
    
    const {hashedToken,unHashedToken,tokenExpiry} = user.generateTemporaryToken();

       user.emailVerificationToken=hashedToken;
       user.emailVerificationExpiry=tokenExpiry;

   const verificationUrl = `${env.BASE_URI}/api/v1/user/verify/email/${unHashedToken}`;
      
    sendEmail(
      user.email,
      "verify email",
      emailVerificationMailgenContent(user.username, verificationUrl) )
    

    res.status(200).json(new ApiResponse(200,user,"Reset eamil-veriry mail send"))
  
});

const resetForgottenPassword = asyncHandler(async (req, res) => {

     const {email} = validateEmailData(req.body).data;

    if(!email){
      throw new ApiError("please provide correct email",400);
    }
     
    const user = await User.findOne({email});

    if(!user){
      throw new ApiError("No user found for this email",400);
    }
    
    const {hashedToken,unHashedToken,tokenExpiry} = user.generateTemporaryToken();

       user.forgotPasswordToken=hashedToken;
       user.forgotPasswordExpiry=tokenExpiry;

    const forgotPasswordURL = `${env.BASE_URI}/api/user/forgot-password/${unHashedToken}`

    sendEmail(
        user.email,
        "fogot Password",
        forgotPasswordMailgenContent(user.username,forgotPasswordURL)
    );

    res.status(200).json(new ApiResponse(200,user,"forgot password mail send"))
  

});


//this not working
const forgotPasswordRequest = asyncHandler(async (req, res) => {

     const {unHashedToken} = req.params;
    
    const {password,confirmPassword} = validateResetPassword(req.body).data;
    
     if(password!==confirmPassword){
    throw new ApiError("write the same Password",400);
  }

    if(!unHashedToken){
    throw new ApiError("token is not geting from URL",400);
  }
   const hashedToken = crypto.createHash("sha256").update(unHashedToken).digest("hex");
    console.log(hashedToken);

  const user = await User.findOne({
          forgotPasswordToken: new mongoose.Types.ObjectId(hashedToken), 
          forgotPasswordExpiry:{$gt: new Date()}                   
  })
         console.log(user);

  if(!user){
    throw new ApiError("user is not get via hashedToken",400);
  }

     user.forgotPasswordToken=undefined;
     user.forgotPasswordExpiry=undefined;
     
         user.password = password;
     
     
     await user.save();

     res.status(200).json(new ApiResponse(200,user, "password is change succesfull"))
  
  });


const changeCurrentPassword = asyncHandler(async (req, res) => {
  
  const {oldPassword,newPassword} = validateChangePassword(req.body).data;

  const userId = req.user._id;

  if(!userId){
    throw new ApiError("did not get userId ",400);
  }

  const user = await User.findOne({_id:userId});

  if(!userId){
    throw new ApiError("user is not get",400);
  }

  const isPasswordMatch = user.isPasswordCorrect(oldPassword);

   if(!isPasswordMatch){
    throw new ApiError("your Old password is wronge",400);
  }

   user.password = newPassword;

   await user.save();

   res.status(200).json(new ApiResponse(200,user,"newPassword is set"));
});

//take look on refreshToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  
      console.log(req.cookies);
      const refreshToken = req.cookies.refreshToken;
      console.log(refreshToken);

      if(!refreshToken){
        throw new ApiError("refresh Token does not provided",400);
      }
          let  decodeToken;
    try {
       decodeToken = jwt.verify(refreshToken,env.REFRESH_TOKEN_SECRET);
        console.log(decodeToken);

    } catch (error) {
        throw new ApiError("refreshtToken is wronge",error);
    }

      const user = await User.findById(decodeToken._id);

    if(!user){
      throw new ApiError("user is not getting",400);
    }
      const accessToken = user.generateAccessToken();

      const cookieOption = {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      }; 

      res.cookie("accessToken",accessToken,cookieOption);
      res.status(200).json(new ApiResponse(200,accessToken,"accessToken is refreshed"));
      
});

const getCurrentUser = asyncHandler(async (req, res) => {
     
  const user = req.user;
   
  if(!user){
    throw new ApiError("user is not gettin",400);
  }
  res.status(200).json(new ApiResponse(200,user,"user is presenetHere"));
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
