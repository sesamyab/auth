import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "../types";
import { GoBack } from "./GoBack";
import Icon from "./Icon";
import i18next from "i18next";

type Props = {
  message: string;
  vendorSettings: VendorSettings;
  pageTitle?: string;
  state?: string;
  spamReminder?: boolean;
};

const MessagePage: FC<Props> = ({
  message,
  vendorSettings,
  pageTitle,
  state,
  spamReminder,
}) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      {pageTitle ? <div class="mb-6 text-gray-300">{pageTitle}</div> : ""}
      <div class="flex flex-1 flex-col justify-center">{message}</div>
      {spamReminder ? (
        <div className="my-4 flex space-x-2 text-sm text-[#B2B2B2]">
          <Icon className="text-base" name="info-bubble" />
          <div className="text-sm text-gray-300 md:text-sm">
            {/* translation string should just be sent_spam */}
            {i18next.t("sent_code_spam")}
          </div>
        </div>
      ) : (
        ""
      )}
      {state ? <GoBack state={state} /> : ""}
    </Layout>
  );
};

export default MessagePage;
