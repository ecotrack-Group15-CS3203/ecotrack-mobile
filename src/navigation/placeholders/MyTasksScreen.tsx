import { useTranslation } from "react-i18next";

import { PlaceholderScreen } from "./PlaceholderScreen";

export function MyTasksScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen label={t("nav.myTasks")} />;
}
