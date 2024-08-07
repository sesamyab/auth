import i18next from "i18next";
import { VendorSettings } from "@authhero/adapter-interfaces";

type Props = {
  vendorSettings?: VendorSettings;
};
const Footer = ({ vendorSettings }: Props) => {
  const { termsAndConditionsUrl } = vendorSettings || {};

  return (
    <div class="mt-8">
      <div class="text-xs text-gray-300">
        {i18next.t("agree_to")}{" "}
        <a
          href={
            termsAndConditionsUrl ||
            "https://store.sesamy.com/pages/terms-of-service"
          }
          class="text-primary hover:underline"
          target="_blank"
        >
          {i18next.t("terms")}
        </a>
      </div>
    </div>
  );
};

export default Footer;
