import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { t } from "i18next";
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

import TextFormField from "@/components/Form/FormFields/TextFormField";
import { validateRule } from "@/components/Users/UserFormValidations";
import { UpdatePasswordForm } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { UserBase } from "@/types/user/user";

const PasswordSchema = z
  .object({
    old_password: z
      .string()
      .min(1, { message: t("please_enter_current_password") }),
    new_password_1: z
      .string()
      .min(8, { message: t("password_length_validation") })
      .regex(/\d/, { message: t("password_number_validation") })
      .regex(/[a-z]/, {
        message: t("password_lowercase_validation"),
      })
      .regex(/[A-Z]/, {
        message: t("password_uppercase_validation"),
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

export default function UserResetPassword({
  userData,
}: {
  userData: UserBase;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const resetPasswordForm = useForm({
    resolver: zodResolver(PasswordSchema),
    defaultValues: {
      old_password: "",
      new_password_1: "",
      new_password_2: "",
    },
  });
  const { mutate: resetUserPasswordMutate, isPending } = useMutation({
    mutationFn: mutate(routes.updatePassword),
    onSuccess: (data: any) => {
      toast.success(data?.message as string);
      resetPasswordForm.reset();
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
    resetUserPasswordMutate(form);
  };

  const renderPasswordForm = () => (
    <Form {...resetPasswordForm}>
      <form onSubmit={resetPasswordForm.handleSubmit(handleSubmitPassword)}>
        <div className="space-y-4">
          <FormField
            control={resetPasswordForm.control}
            name="old_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("old_password")}</FormLabel>
                <FormControl>
                  <TextFormField
                    {...field}
                    type="password"
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
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
                    type="password"
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
                    onFocus={() => setIsPasswordFieldFocused(true)}
                    onBlur={() => setIsPasswordFieldFocused(false)}
                  />
                </FormControl>

                {resetPasswordForm.formState.errors?.new_password_1?.message &&
                  resetPasswordForm.formState.errors?.new_password_1?.message.includes(
                    t("new_password_same_as_old"),
                  ) && <FormMessage />}
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
                    type="password"
                    onChange={(value) => {
                      field.onChange(value.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={!resetPasswordForm.formState.isDirty}
          variant="primary"
          className="mt-6 w-full"
        >
          {isPending ? t("submitting") : t("submit")}
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
