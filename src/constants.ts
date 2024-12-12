export const ACCESS_TOKEN_EXPIRE_IN_SECONDS = 60 * 60 * 24; // 24 hours
export const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

export const UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 1 day
export const OAUTH2_CODE_EXPIRES_IN_SECONDS = 5 * 60; // 5 minutes

export const CODE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
export const EMAIL_VERIFICATION_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // One week
export const LOGIN_SESSION_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const CLIENT_ID = process.env.CLIENT_ID || "default";
