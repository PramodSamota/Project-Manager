import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { env } from "./validators/env.js";

dotenv.config({
  path: "./.env",
});

const PORT = env.PORT ?? 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
  })
  .catch((err) => {
    console.error("Mongodb connection error", err);
  });
