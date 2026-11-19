import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { AuthCard } from "@/components/Auth/AuthCard";
import { AuthLayout } from "@/components/Auth/AuthLayout";

import {
  PasswordErrors,
  PasswordFields,
  validatePasswordFields,
} from "@/components/Auth/PasswordFields";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import authApi from "@/types/auth/authApi";

interface ResetPasswordProps {
  token: string;
}

const ResetPassword = (props: ResetPasswordProps) => {
  const [form, setForm] = useState({
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    const fieldValue = { ...form, [name]: value };
    const errorField = { ...errors };
    if (errorField[name as keyof PasswordErrors]) {
      errorField[name as keyof PasswordErrors] = null;
      setErrors(errorField);
    }
    setForm(fieldValue);
  };

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: mutate(authApi.resetPassword),
    onSuccess: () => {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      localStorage.removeItem(LocalStorageKeys.refreshToken);
      toast.success(t("password_reset_success"));
      navigate("/login");
    },
    onError: (error) => {
      if (error.cause) {
        setErrors(error.cause as PasswordErrors);
      }
    },
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validatePasswordFields(form, t);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    resetPassword({ token: props.token, password: form.password });
  };

  const { isError } = useQuery({
    queryKey: ["checkResetToken", { token: props.token }],
    queryFn: query(authApi.checkResetToken, { body: { token: props.token } }),
    enabled: !!props.token,
  });

  if (isError) navigate("/invalid-reset");

  return (
    <AuthLayout>
      <AuthCard
        back={{ label: t("back_to_login"), onClick: () => navigate("/login") }}
        title={t("reset_password")}
      >
        <form noValidate className="grid gap-6" onSubmit={handleSubmit}>
          <PasswordFields
            password={form.password}
            confirm={form.confirm}
            errors={errors}
            onChange={handleChange}
            isPasswordFieldFocused={isPasswordFieldFocused}
            onPasswordFocusChange={setIsPasswordFieldFocused}
          />
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("reset_password")}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

export default ResetPassword;
