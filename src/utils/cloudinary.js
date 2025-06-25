import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "../validators/env.js";
import { ApiError } from "./api-error.js";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    logger.info("File is Uploaded Succesfully on CLoudnary!!!", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    throw new ApiError(500, "Failed to upload on cloudinary", error);
  }
};

export { uploadOnCloudinary };
