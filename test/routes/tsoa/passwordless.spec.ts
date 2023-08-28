import { contextFixture } from "../../fixtures";
import { PasswordlessController } from "../../../src/routes/tsoa/passwordless";
import { AuthorizationResponseType } from "../../../src/types";
import { requestWithContext } from "../../fixtures/requestWithContext";

describe("Passwordless", () => {
  describe("start", () => {
    it("should send a code to the user", async () => {
      const controller = new PasswordlessController();

      const body = {
        client_id: "clientId",
        connection: "email",
        send: "code",
        email: "markus@ahlstrand.es",
        authParams: {
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
          redirect_uri: "http://localhost:3000/callback",
          scope: "openid profile email",
          audience: "https://sesamy.com",
          state: "spstFO05XU5R-fhzQSLnuHnYVhyd5-GP",
          nonce: "~9y0-hSpK3ATR6Fo0NJ.v3kMro3cfA.p",
        },
      };

      // TODO - can we type this?
      const logs: any = [];

      const ctx = contextFixture({
        stateData: {},
        logs,
      });

      await controller.startPasswordless(body, requestWithContext(ctx));

      const sentEmail = logs[0];

      expect(sentEmail.from).toEqual({
        email: "senderEmail",
        name: "senderName",
      });

      expect(sentEmail.subject).toEqual(
        "Welcome to clientName! 123456 is the login code"
      );

      expect(sentEmail.content[0].type).toEqual("text/plain");

      // this text seems wrong  8-0
      expect(sentEmail.content[0].value).toContain(
        "Welcome to clientName! 123456 is the login code"
      );
      // TODO - we could load this into a browser in playwright and snapshot it...

      expect(sentEmail.to).toEqual([
        {
          // TODO - change these before release? Test that they are changing for kvartal emails?
          email: "markus@ahlstrand.es",
          name: "markus@ahlstrand.es",
        },
      ]);
    });
  });
});
