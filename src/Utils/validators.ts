import { t } from "i18next";
import { z } from "zod";

export default {
  coordinates: {
    latitude: z
      .number()
      .min(-90, t("invalid_latitude"))
      .max(90, t("invalid_latitude")),
    longitude: z
      .number()
      .min(-180, t("invalid_longitude"))
      .max(180, t("invalid_longitude")),
  },
};
