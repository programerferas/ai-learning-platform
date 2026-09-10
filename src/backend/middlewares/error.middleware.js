import { ZodError } from "zod";
import { Prisma } from "@prisma/client";   

export const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ message: "Invalid reference" });
    }
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ message: "Session expired, please log in again" });
  }

  const statusCode = err.statusCode || err.status || 500;

  const message =
    process.env.NODE_ENV === "production"
      ? err.isOperational
        ? err.message
        : "Internal Server Error"
      : err.message;

  if (!err.isOperational) {
    console.error("ERROR:", err);
  }

  res.status(statusCode).json({ message });
};