import mongoose from "mongoose";

const typingSessionSchema = new mongoose.Schema(
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
      default: null,
    },
    detectedUser: {
      type: String,
      required: true,
      trim: true,
    },
    typedText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    promptText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    dwellTimes: {
      type: [Number],
      default: [],
    },
    flightTimes: {
      type: [Number],
      default: [],
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
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    authStatus: {
      type: String,
      required: true,
      enum: ["authenticated", "fallback", "denied", "otp_pending"],
    },
    authMethod: {
      type: String,
      required: true,
      enum: ["typing", "typing+fallback", "password-only"],
      default: "typing",
    },
    warnings: {
      type: [String],
      default: [],
    },
    featureMetrics: {
      keyCount: { type: Number, default: 0, min: 0 },
      backspaceCount: { type: Number, default: 0, min: 0 },
      backspaceRate: { type: Number, default: 0, min: 0 },
      typingDurationMs: { type: Number, default: 0, min: 0 },
      wpm: { type: Number, default: 0, min: 0 },
      wps: { type: Number, default: 0, min: 0 },
      cps: { type: Number, default: 0, min: 0 },
      promptMatchRatio: { type: Number, default: 0, min: 0, max: 100 },
      dwellVariance: { type: Number, default: 0, min: 0 },
      flightVariance: { type: Number, default: 0, min: 0 },
      consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
      tenSecondWpm: { type: Number, default: 0, min: 0 },
      tenSecondWps: { type: Number, default: 0, min: 0 },
      tenSecondMatch: { type: Boolean, default: false },
    },
    fallbackAttempted: {
      type: Boolean,
      default: false,
    },
    fallbackSuccessful: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["live-demo", "collector"],
      default: "live-demo",
    },
  },
  {
    timestamps: true,
  },
);

typingSessionSchema.index({ createdAt: -1 });
typingSessionSchema.index({ detectedUser: 1, createdAt: -1 });
typingSessionSchema.index({ createdBy: 1, createdAt: -1 });

const TypingSession = mongoose.model("TypingSession", typingSessionSchema);

export default TypingSession;
