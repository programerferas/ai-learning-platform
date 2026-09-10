import { IS_PROD } from "../config/env.js";

const serializeError = (err) => {
  if (!err) return undefined;
  return {
    name: err.name,
    message: err.message,
    code: err.code, // Prisma / SMTP error codes
    stack: IS_PROD ? undefined : err.stack,
  };
};

const write = (level, event, data = {}) => {
  const { err, ...rest } = data;
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...rest,
    ...(err ? { err: serializeError(err) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

export default {
  info: (event, data) => write("info", event, data),
  warn: (event, data) => write("warn", event, data),
  error: (event, data) => write("error", event, data),
};