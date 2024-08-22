export function samlResponseForm(postUrl: string, base64EncodedSaml: string) {
  const relayState =
    '<input type="hidden" name="RelayState" value="OPTIONAL_RELAY_STATE_HERE" />';

  const samlResponseTempate = `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
    <noscript>
        <p>Your browser has JavaScript disabled. Please click the button below to continue:</p>
        <input type="submit" value="Continue">
    </noscript>
    <form method="post" action="${postUrl}">
        <input type="hidden" name="SAMLResponse" value="${base64EncodedSaml}" />        
    </form>
    <script>
    window.onload = function() {{
        document.forms[0].submit();
    }};
    </script>
</body>
</html>`;

  return new Response(samlResponseTempate, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
