import { t } from "i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod/v4";

export default () => ({
  phoneNumber: {
    optional: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        error: t("phone_number_validation_error"),
      }),

    required: z
      .string()
      .min(1, { error: t("field_required") })
      .refine((val) => isValidPhoneNumber(val), {
        error: t("phone_number_validation_error"),
      }),
  },

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
  pincode: z
    .number()
    .int()
    .positive()
    .min(100000, t("pincode_must_be_6_digits"))
    .max(999999, t("pincode_must_be_6_digits")),
});
