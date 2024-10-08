import { CLIENT_ID } from "../constants";

function getSwaggerHtml() {
  return `<!-- HTML for static distribution bundle build -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css" integrity="sha512-JArlzA682ixxKlWoGxYQxF+vHv527K1/NMnGbMxZERWr/16D7ZlPZUdq9+n5cA3TM030G57bSXYdN706FU9doQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link
      rel="icon"
      type="image/png"
      href="./favicon-32x32.png"
      sizes="32x32"
    />
    <link
      rel="icon"
      type="image/png"
      href="./favicon-16x16.png"
      sizes="16x16"
    />
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }

      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }

      body {
        margin: 0;
        background: #fafafa;
      }
    </style>
  </head>

  <body>
    <div id="swagger-ui"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js" integrity="sha512-8FFvTCXo6KgUt72SMpgMgMHoHnNUOPxndku0/mc+B98qIeEfZ6dpPDYJv6a1TRWHoEZeMQAKQzcwSmQixM9v2w==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js" integrity="sha512-D0LLkbspjpDlVcVweqnmQGAHf4evBLmiyTVFxvh+c/vnJduLdDtSwT2rHg4q9bPXIp4MtY4r6fbutZsTjnoYZA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>
      window.onload = function () {
        // Begin Swagger UI call region
        const ui = SwaggerUIBundle({
          urls: [
            {
              url: "/spec",
              name: "OAuth api"
            },
            {
              url: "/api/v2/spec",
              name: "Management api"
            },
             {
              url: "/saml-spec",
              name: "SAML api"
            }
          ],
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout",
        });
        // End Swagger UI call region


        if (ui.hasOwnProperty("initOAuth")) {
          ui.initOAuth({"clientId":"${CLIENT_ID}","appName":"sesamy"})
        }

        window.ui = ui;
      };
    </script>
  </body>
</html>`;
}

export default async function swaggerUi() {
  return new Response(getSwaggerHtml(), {
    headers: {
      "content-type": "text/html",
    },
  });
}
