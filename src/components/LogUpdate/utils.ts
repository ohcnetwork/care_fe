import { IconName } from "@/CAREUI/icons/CareIcon";

import { DailyRoundsModel } from "@/components/Patient/models";

export type LogUpdateSectionProps = {
  log: DailyRoundsModel;
  onChange: (log: DailyRoundsModel) => void;
  readonly?: boolean;
};

export type LogUpdateSectionMeta = {
  title: string;
  description?: string;
  icon?: IconName;
};
