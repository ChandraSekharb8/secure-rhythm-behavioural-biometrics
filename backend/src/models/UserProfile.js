import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    avgDwell: {
      type: Number,
      required: true,
      min: 0,
    },
    avgFlight: {
      type: Number,
      required: true,
      min: 0,
    },
    tolerance: {
      type: Number,
      required: true,
      min: 1,
      default: 40,
    },
    color: {
      type: String,
      required: true,
      default: "#00d2d3",
    },
    fallbackPasswordHash: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
