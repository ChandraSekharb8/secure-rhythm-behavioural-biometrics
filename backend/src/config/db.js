import mongoose from "mongoose";
import { env } from "./env.js";

export const connectToDatabase = async () => {
  console.log("Mongo URI:", env.mongoUri);

  try {
    await mongoose.connect(env.mongoUri);

    console.log("✅ Connected");
  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);
    throw err;
  }
};

export const disconnectDatabase = async () => {
  await mongoose.connection.close();
};