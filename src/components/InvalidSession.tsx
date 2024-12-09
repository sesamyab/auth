import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "authhero";
import Button from "./Button";

type Props = {
  redirectUrl?: string;
  vendorSettings: VendorSettings;
};

const InvalidSessionPage: FC<Props> = (params) => {
  const { redirectUrl, vendorSettings } = params;

  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div className="flex flex-1 flex-col justify-center">
        The login session in not valid.
      </div>
      <div className="flex flex-1 flex-col justify-center">
        {redirectUrl && (
          <Button href={redirectUrl} className="text-primary hover:underline">
            Continue
          </Button>
        )}
      </div>
    </Layout>
  );
};

export default InvalidSessionPage;
