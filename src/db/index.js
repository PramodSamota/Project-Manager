import mongoose from "mongoose";
import { env } from "../validators/env.js";
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
};

export default connectDB;
