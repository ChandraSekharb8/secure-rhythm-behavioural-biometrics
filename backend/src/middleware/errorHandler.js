import { HttpError } from "../utils/httpError.js";

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.name === "ZodError") {
    res.status(400).json({
      message: "Invalid request payload",
      details: error.issues.map((issue) => issue.message),
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({
      message: "Duplicate value exists for a unique field",
    });
    return;
  }

  res.status(500).json({
    message: "Unexpected server error",
  });
};