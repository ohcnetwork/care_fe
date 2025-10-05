import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { PasswordInput } from "@/components/ui/input-password";

import { ValidationHelper } from "@/components/Users/UserFormValidations";
import { UpdatePasswordForm } from "@/components/Users/models";

import mutate from "@/Utils/request/mutate";
import authApi from "@/types/auth/authApi";
import { UserReadMinimal } from "@/types/user/user";

export default function UserResetPassword({
  userData,
}: {
  userData: UserReadMinimal;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const PasswordSchema = z
    .object({
      old_password: z
        .string()
        .min(1, { message: t("please_enter_current_password") }),
      new_password_1: z
        .string()
        .min(8, { message: t("invalid_password") })
        .regex(/\d/, { message: t("invalid_password") })
        .regex(/[a-z]/, {
          message: t("invalid_password"),
        })
        .regex(/[A-Z]/, {
          message: t("invalid_password"),
        }),
      new_password_2: z
        .string()
        .min(1, { message: t("please_enter_confirm_password") }),
    })
    .refine((values) => values.new_password_1 === values.new_password_2, {
      message: t("password_mismatch"),
      path: ["new_password_2"],
    })
    .refine((values) => values.new_password_1 !== values.old_password, {
      message: t("new_password_same_as_old"),
      path: ["new_password_1"],
    });

  const form = useForm({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      old_password: "",
      new_password_1: "",
      new_password_2: "",
    },
  });
  const { mutate: updatePassword, isPending } = useMutation({
    mutationFn: mutate(authApi.updatePassword),
    onSuccess: () => {
      toast.success(t("password_updated"));
      form.reset();
    },
  });

  const handleSubmitPassword = async (
    formData: z.infer<typeof PasswordSchema>,
  ) => {
    const form: UpdatePasswordForm = {
      old_password: formData.old_password,
      username: userData.username,
      new_password: formData.new_password_1,
    };
    updatePassword(form);
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm sm:rounded-lg sm:px-6 sm:py-6">
      {!isEditing && (
        <div className="flex justify-center sm:justify-start">
          <Button
            onClick={() => setIsEditing(true)}
            type="button"
            id="change-edit-password-button"
            variant="primary"
          >
            <CareIcon
              icon={isEditing ? "l-times" : "l-pen"}
              className="size-4"
            />
            {t("update_password")}
          </Button>
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitPassword)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("old_password")}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        autoComplete="current-password"
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <FormField
                    control={form.control}
                    name="new_password_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("new_password")}</FormLabel>
                        <FormControl>
                          <PasswordInput
                            {...field}
                            autoComplete="new-password"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            onFocus={() => setIsPasswordFieldFocused(true)}
                            onBlur={() => setIsPasswordFieldFocused(false)}
                          />
                        </FormControl>
                        {isPasswordFieldFocused ? (
                          <div
                            className="text-small mt-2 pl-2 text-secondary-500"
                            aria-live="polite"
                          >
                            <ValidationHelper
                              isInputEmpty={!field.value}
                              successMessage={t("password_success_message")}
                              validations={[
                                {
                                  description: "password_length_validation",
                                  fulfilled: field.value.length >= 8,
                                },
                                {
                                  description: "password_lowercase_validation",
                                  fulfilled: /[a-z]/.test(field.value),
                                },
                                {
                                  description: "password_uppercase_validation",
                                  fulfilled: /[A-Z]/.test(field.value),
                                },
                                {
                                  description: "password_number_validation",
                                  fulfilled: /\d/.test(field.value),
                                },
                                {
                                  description: "new_password_same_as_old",
                                  fulfilled:
                                    field.value !== form.watch("old_password"),
                                },
                              ]}
                            />
                          </div>
                        ) : (
                          <FormMessage />
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col">
                  <FormField
                    control={form.control}
                    name="new_password_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("new_password_confirmation")}</FormLabel>
                        <FormControl>
                          <PasswordInput
                            {...field}
                            autoComplete="new-password"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center sm:justify-start gap-3 mt-4">
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  form.reset();
                  setIsEditing(false);
                }}
                variant="secondary"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || isPending}
                variant="primary"
              >
                {isPending && (
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                )}
                {isPending ? t("updating") : t("update_password")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
