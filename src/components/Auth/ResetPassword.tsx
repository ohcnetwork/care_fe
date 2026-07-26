import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  NewPasswordErrors,
  NewPasswordFields,
  validateNewPasswordFields,
} from "@/components/Auth/NewPasswordFields";

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
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    const fieldValue = { ...form, [name]: value };
    const errorField = { ...errors };
    if (errorField[name as keyof NewPasswordErrors]) {
      errorField[name as keyof NewPasswordErrors] = null;
      setErrors(errorField);
    }
    setForm(fieldValue);
  };

  const { mutate: resetPassword } = useMutation({
    mutationFn: mutate(authApi.resetPassword),
    onSuccess: () => {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      toast.success(t("password_reset_success"));
      navigate("/login");
    },
    onError: (error) => {
      if (error.cause) {
        setErrors(error.cause as NewPasswordErrors);
      }
    },
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateNewPasswordFields(form, t);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="w-full max-w-md mx-auto rounded-lg bg-white shadow-lg p-6"
        onSubmit={handleSubmit}
      >
        <div className="py-4 text-center text-xl font-bold">
          {t("reset_password")}
        </div>

        <NewPasswordFields
          password={form.password}
          confirm={form.confirm}
          errors={errors}
          onChange={handleChange}
          isPasswordFieldFocused={isPasswordFieldFocused}
          onPasswordFocusChange={setIsPasswordFieldFocused}
        />

        <div className="grid p-4 sm:flex sm:justify-between gap-4 mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto"
          >
            <span>{t("cancel")}</span>
          </Button>
          <Button variant="primary" type="submit" className="w-full sm:w-auto">
            <span>{t("reset")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
