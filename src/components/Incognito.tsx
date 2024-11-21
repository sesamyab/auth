import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "@authhero/adapter-interfaces";

type Props = {
  redirectUrl: string;
  vendorSettings: VendorSettings;
};

const IncognitoPage: FC<Props> = ({ redirectUrl, vendorSettings }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div className="flex flex-1 flex-col justify-center">
        It looks like you are using a incognito browser.{" "}
        <a href={redirectUrl} className="text-primary hover:underline">
          Click this link to continue
        </a>
      </div>
    </Layout>
  );
};

export default IncognitoPage;
