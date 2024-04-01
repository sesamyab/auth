import { z } from "zod";

// Enum for LogTypes
const LogType = z.enum([
  "sapi", // SUCCESS_API_OPERATION
  // "ssa", SUCCESS_SILENT_AUTH - omitted for brevity and since it's clear from context
  "fsa", // FAILED_SILENT_AUTH
  "ss", // SUCCESS_SIGNUP
  // FAILED_SIGNUP = "fs", - we don't have this in the logs yet
  "s", // SUCCESS_LOGIN
  "f", // FAILED_LOGIN
  "fp", // FAILED_LOGIN_INCORRECT_PASSWORD
  // FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu", - we don't have this in the logs yet
  "slo", // SUCCESS_LOGOUT
  "scoa", // SUCCESS_CROSS_ORIGIN_AUTHENTICATION
  "fcoa", // FAILED_CROSS_ORIGIN_AUTHENTICATION
  "seccft", // NOT_IMPLEMENTED_1 - not implemented - just for completion as we do get this in our latest auth0 logs
  "cls", // NOT_IMPLEMENTED_2
]);

export type LogType = z.infer<typeof LogType>;

// Auth0Client Type
const Auth0Client = z.object({
  name: z.string(),
  version: z.string(),
  env: z
    .object({
      node: z.string().optional(),
    })
    .optional(),
});

// LogCommonFields Interface
const LogCommonFields = z.object({
  type: LogType,
  date: z.string(),
  description: z.string().optional(),
  ip: z.string(),
  user_agent: z.string(),
  details: z.any().optional(), // Using z.any() as a placeholder for "details" type
  isMobile: z.boolean(),
});

// BrowserLogCommonFields Interface
const BrowserLogCommonFields = LogCommonFields.extend({
  user_id: z.string(),
  user_name: z.string(),
  // do not have this field yet in SQL
  connection: z.string().optional(),
  connection_id: z.string(),
  client_id: z.string().optional(),
  client_name: z.string(),
});

// Success and Failure Interfaces
const SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant =
  BrowserLogCommonFields.extend({
    type: z.literal("seccft"),
    audience: z.string().optional(),
    scope: z.union([z.array(z.string()), z.string()]).optional(), // notice how this can be both in auth0! interesting
    strategy: z.string().optional(),
    strategy_type: z.string().optional(),
    hostname: z.string(),
    auth0_client: Auth0Client,
  });

const SuccessCrossOriginAuthentication = BrowserLogCommonFields.extend({
  type: z.literal("scoa"),
  hostname: z.string(),
  auth0_client: Auth0Client,
});

const FailedCrossOriginAuthentication = LogCommonFields.extend({
  type: z.literal("fcoa"),
  hostname: z.string(),
  connection_id: z.string(),
  auth0_client: Auth0Client,
});

// SuccessApiOperation Interface
const SuccessApiOperation = LogCommonFields.extend({
  type: z.literal("sapi"),
  client_id: z.string().optional(),
  client_name: z.string(),
});

// FailedLogin Interface
const FailedLogin = LogCommonFields.extend({
  type: z.literal("f"),
});

// FailedLoginIncorrectPassword Interface
const FailedLoginIncorrectPassword = BrowserLogCommonFields.extend({
  type: z.literal("fp"),
  strategy: z.string(),
  strategy_type: z.string(),
});

// CodeLinkSent Interface
const CodeLinkSent = BrowserLogCommonFields.extend({
  type: z.literal("cls"),
  strategy: z.string(),
  strategy_type: z.string(),
});

// FailedSilentAuth Interface
const FailedSilentAuth = LogCommonFields.extend({
  type: z.literal("fsa"),
  hostname: z.string(),
  audience: z.string(),
  scope: z.array(z.string()),
  client_id: z.string().optional(),
  client_name: z.string(),
  auth0_client: Auth0Client,
});

// SuccessLogout Interface
const SuccessLogout = BrowserLogCommonFields.extend({
  type: z.literal("slo"),
  hostname: z.string(),
});

// SuccessLogin Interface
const SuccessLogin = BrowserLogCommonFields.extend({
  type: z.literal("s"),
  strategy: z.string(),
  strategy_type: z.string(),
  hostname: z.string(),
});

// SuccessSilentAuth Interface
const SuccessSilentAuth = LogCommonFields.extend({
  type: z.literal("ssa"),
  hostname: z.string(),
  client_id: z.string().optional(),
  client_name: z.string(),
  session_connection: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  auth0_client: Auth0Client,
});

// SuccessSignup Interface
const SuccessSignup = BrowserLogCommonFields.extend({
  type: z.literal("ss"),
  hostname: z.string(),
  strategy: z.string(),
  strategy_type: z.string(),
});

export const logSchema = z.union([
  SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant,
  SuccessCrossOriginAuthentication,
  SuccessApiOperation,
  FailedLoginIncorrectPassword,
  FailedCrossOriginAuthentication,
  CodeLinkSent,
  FailedSilentAuth,
  SuccessLogout,
  SuccessLogin,
  SuccessSilentAuth,
  SuccessSignup,
  FailedLogin,
]);

export type LogResponse = z.infer<typeof logSchema>;
