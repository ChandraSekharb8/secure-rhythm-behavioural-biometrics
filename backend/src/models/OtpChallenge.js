import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      default: null,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypingSession",
      default: null,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["typing-auth", "password-auth"],
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

export default OtpChallenge;
