import { useTranslation } from "react-i18next";

import { PlaceholderScreen } from "./PlaceholderScreen";

export function MapScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen label={t("nav.map")} />;
}
