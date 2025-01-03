import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import TextFormField from "@/components/Form/FormFields/TextFormField";
import { validateRule } from "@/components/Users/UserFormValidations";
import { UpdatePasswordForm } from "@/components/Users/models";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { UserBase } from "@/types/user/user";

const PasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, { message: "Please enter current password" }),
    new_password_1: z
      .string()
      .min(8, { message: "New password must be at least 8 characters long" })
      .regex(/\d/, { message: "Password must contain at least one number" })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      }),
    new_password_2: z
      .string()
      .min(1, { message: "Please confirm your new password" }),
  })
  .refine((values) => values.new_password_1 === values.new_password_2, {
    message: "New password and confirm password must be the same.",
    path: ["new_password_2"],
  });

export default function UserResetPassword({
  userData,
}: {
  userData: UserBase;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const resetPasswordForm = useForm({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      current_password: "",
      new_password_1: "",
      new_password_2: "",
    },
  });
  const handleSubmitPassword = async (
    formData: z.infer<typeof PasswordSchema>,
  ) => {
    setIsSubmitting(true);

    const form: UpdatePasswordForm = {
      old_password: formData.current_password,
      username: userData.username,
      new_password: formData.new_password_1,
    };

    const { res, data, error } = await request(routes.updatePassword, {
      body: form,
    });

    if (res?.ok) {
      Notification.Success({ msg: data?.message as string });
    } else {
      Notification.Error({
        msg: error?.message ?? t("password_update_error"),
      });
    }
    setIsSubmitting(false);
  };

  const renderPasswordForm = () => (
    <Form {...resetPasswordForm}>
      <form onSubmit={resetPasswordForm.handleSubmit(handleSubmitPassword)}>
        <div className="space-y-4">
          <FormField
            control={resetPasswordForm.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("current_password")}</FormLabel>
                <FormControl>
                  <TextFormField
                    {...field}
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={resetPasswordForm.control}
            name="new_password_1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("new_password")}</FormLabel>
                <FormControl>
                  <TextFormField
                    {...field}
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
                    onFocus={() => setIsPasswordFieldFocused(true)}
                    onBlur={() => setIsPasswordFieldFocused(false)}
                  />
                </FormControl>
                {isPasswordFieldFocused && (
                  <div
                    className="text-small mt-2 pl-2 text-secondary-500"
                    aria-live="polite"
                  >
                    {validateRule(
                      field.value.length >= 8,
                      t("password_length_validation"),
                      !field.value,
                    )}
                    {validateRule(
                      /[a-z]/.test(field.value),
                      t("password_lowercase_validation"),
                      !field.value,
                    )}
                    {validateRule(
                      /[A-Z]/.test(field.value),
                      t("password_uppercase_validation"),
                      !field.value,
                    )}
                    {validateRule(
                      /\d/.test(field.value),
                      t("password_number_validation"),
                      !field.value,
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={resetPasswordForm.control}
            name="new_password_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("new_password_confirmation")}</FormLabel>
                <FormControl>
                  <TextFormField
                    {...field}
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          className="mt-6 w-full"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Form>
  );
  const editButton = () => (
    <div className="mb-4 flex justify-start">
      <Button
        onClick={() => setIsEditing(!isEditing)}
        type="button"
        id="change-edit-password-button"
        className="flex items-center gap-2 rounded-sm border border-gray-100 bg-white px-3 py-1.5 text-sm text-[#009D48] shadow-sm hover:bg-gray-50"
      >
        <CareIcon icon={isEditing ? "l-times" : "l-edit"} className="h-4 w-4" />
        {isEditing ? t("cancel") : t("change_password")}
      </Button>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6">
      {editButton()}
      {isEditing && renderPasswordForm()}
    </div>
  );
}
