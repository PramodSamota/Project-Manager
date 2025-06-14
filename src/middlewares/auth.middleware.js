import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { env } from "../validators/env.js";

const isLoggedIn = async (req, res, next) => {
  //   console.log(req.cookies);

  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    throw new ApiError(401, "access Token is not provided");
  }

  // if i am not using try catch then it is not running why?
  try {
    const decodedToken = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken; // ✅ attach user info to req
    next(); // ✅ move to controller
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token", error);
  }
};

export { isLoggedIn };
