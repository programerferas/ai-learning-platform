import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ALGORITHM = "HS256";
const CLAIMS = { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE };


export const signAuthToken = (user) =>
  jwt.sign({ id: user.id }, env.JWT_SECRET, {
    ...CLAIMS,
    algorithm: ALGORITHM, // مفردة عند التوقيع
    expiresIn: env.JWT_EXPIRES_IN,
  });


export const verifyAuthToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    ...CLAIMS,
    algorithms: [ALGORITHM], 
  });