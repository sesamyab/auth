import {
  TokenResponse,
  GrantType,
  CodeResponse,
  tokenParams,
  tokenParamsUnion,
  clientCredentialGrantTypeParams,
} from "../../types/Token";
import {
  authorizeCodeGrant,
  pkceAuthorizeCodeGrant,
  clientCredentialsGrant,
} from "../../token-grant-types";
import { Env } from "../../types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Var } from "../../types/Var";
import { HTTPException } from "hono/http-exception";

export const token = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /oauth2/token
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {
        body: {
          content: {
            "application/x-www-form-urlencoded": { schema: tokenParams },
            "application/json": { schema: tokenParams },
          },
        },
      },
      responses: {
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      // Apply a strict validation
      const body = tokenParamsUnion.parse(ctx.req.valid("json"));

      let token: TokenResponse | CodeResponse;
      switch (body.grant_type) {
        case GrantType.AuthorizationCode:
          if ("client_secret" in body) {
            return authorizeCodeGrant(ctx, body);
          } else {
            return pkceAuthorizeCodeGrant(ctx, body);
          }
        case GrantType.ClientCredential:
          return clientCredentialsGrant(
            ctx,
            clientCredentialGrantTypeParams.parse(body),
          );
        default:
          throw new HTTPException(400, {
            message: "Grant type not supported",
          });
      }
    },
  );
