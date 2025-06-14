import { ApiError } from "./api-error.js";
import mongoose from "mongoose";

export const validateObjectId = (id, existingPath) => {
  const isIdValid = mongoose.Types.ObjectId.isValid(id);
  if (!isIdValid) {
    throw new ApiError(400, `Invalid ${existingPath}`);
  }
};
