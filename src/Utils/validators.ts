import { t } from "i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import { validateLatitude, validateLongitude } from "@/common/validation";

export default {
  phoneNumber: {
    optional: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),
    required: z
      .string()
      .min(1, t("field_required"))
      .refine((val) => isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),
  },

  coordinates: {
    latitude: {
      required: z.string().refine((val) => validateLatitude(val), {
        message: t("invalid_latitude"),
      }),
      optional: z
        .string()
        .optional()
        .refine((val) => !val || validateLatitude(val), {
          message: t("invalid_latitude"),
        }),
    },
    longitude: {
      required: z.string().refine((val) => validateLongitude(val), {
        message: t("invalid_longitude"),
      }),
      optional: z
        .string()
        .optional()
        .refine((val) => !val || validateLongitude(val), {
          message: t("invalid_longitude"),
        }),
    },
  },
};
