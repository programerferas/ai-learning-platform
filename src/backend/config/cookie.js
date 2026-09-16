import {
  env,
  IS_PROD,
  CROSS_SITE_COOKIES,
  JWT_COOKIE_MAX_AGE_MS,
} from "./env.js";

export const AUTH_COOKIE = env.COOKIE_NAME;


export const authCookieOptions = () => ({
  httpOnly: true, 
  secure: IS_PROD || CROSS_SITE_COOKIES,
  sameSite: CROSS_SITE_COOKIES ? "none" : "lax",
  domain: env.COOKIE_DOMAIN || undefined, 
  path: "/",
  maxAge: JWT_COOKIE_MAX_AGE_MS, 
});


export const clearAuthCookieOptions = () => {
  const { maxAge, ...rest } = authCookieOptions();
  return rest;
};