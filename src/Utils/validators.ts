import { t } from "i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

export default () => ({
  phoneNumber: {
    optional: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),

    required: z
      .string()
      .min(1, { message: t("field_required") })
      .refine((val) => isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
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

  age: z
    .number()
    .int()
    .positive()
    .min(1, t("age_must_be_positive"))
    .max(120, t("age_must_be_below_120")),
});
