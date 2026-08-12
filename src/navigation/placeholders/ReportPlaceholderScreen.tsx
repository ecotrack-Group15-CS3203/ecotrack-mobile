import { useTranslation } from "react-i18next";

import { PlaceholderScreen } from "./PlaceholderScreen";

export function ReportPlaceholderScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen label={t("nav.report")} />;
}
