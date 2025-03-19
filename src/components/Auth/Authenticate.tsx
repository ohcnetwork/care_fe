import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuthContext } from "@/hooks/useAuthUser";

import { MFAMethod, MFAOption } from "@/types/auth/otp";

import { AuthHero } from "./AuthHero";

export const Authenticate = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string>("");
  const [currentMethod, setCurrentMethod] = useState<MFAMethod>("totp");
  const { verifyMFA, isVerifyingMFA } = useAuthContext();

  // Available MFA methods configuration
  const mfaOptions: MFAOption[] = [
    {
      id: "totp",
      label: t("use_auth_app"),
    },
    {
      id: "backup",
      label: t("use_backup_code"),
    },
    // Add more methods here as we make them available
  ];

  // Form validation schema
  const formSchema = z.object({
    code: z.string(),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
    mode: "onChange",
  });

  const codeValue = form.watch("code");

  // Get temp token from localStorage
  const temp_token = localStorage.getItem("mfa_temp_token");

  useEffect(() => {
    if (!temp_token) {
      navigate("/login");
    }
  }, [temp_token]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values) => {
    if (!temp_token) {
      setError(t("session_expired"));
      navigate("/login");
      return;
    }

    try {
      await verifyMFA({
        method: currentMethod,
        code: values.code,
        temp_token,
      });
    } catch (_err: any) {
      // Handle specific API error messages
      if (_err?.response?.data?.detail) {
        setError(_err.response.data.detail);
      }
    }
  });

  // Get available alternative methods based on current method
  const alternativeMethods = mfaOptions.filter(
    (option) => option.id !== currentMethod,
  );

  // Handle method change
  const handleMethodChange = (method: MFAMethod) => {
    setCurrentMethod(method);
    form.reset();
    setError("");
  };

  return (
    <div className="relative flex min-h-screen flex-col md:h-screen md:flex-row">
      <AuthHero />
      {/* Login Forms Section */}
      <div className="login-hero-form py-16 w-full md:mt-0 md:h-full md:w-1/2">
        <div className="relative h-full items-center flex justify-center md:flex">
          <div className="w-full max-w-[400px] space-y-6">
            <Card className="mx-4">
              <CardHeader className="space-y-1 px-4">
                <CardTitle className="text-3xl font-bold w-15 text-black text-center">
                  {t("authenticate_your_account")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={currentMethod === "backup" ? 8 : 6}
                                pattern={REGEXP_ONLY_DIGITS}
                                value={field.value}
                                onChange={field.onChange}
                                autoComplete="one-time-code"
                              >
                                <InputOTPGroup>
                                  {[
                                    ...Array(
                                      currentMethod === "backup" ? 8 : 6,
                                    ),
                                  ].map((_, index) => (
                                    <InputOTPSlot key={index} index={index} />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                          </FormControl>
                          <FormLabel className="mt-3 text-center">
                            {currentMethod === "backup"
                              ? t("enter_recovery_code")
                              : t("enter_2fa_code")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full mt-4"
                      variant="primary"
                      disabled={
                        isVerifyingMFA ||
                        codeValue.length < (currentMethod === "backup" ? 8 : 6)
                      }
                    >
                      {isVerifyingMFA ? t("verifying") : t("verify")}{" "}
                      <CareIcon icon="l-angle-right" className="ml-2 text-sm" />
                    </Button>

                    <p className="text-sm text-red-500 font-base mt-3">
                      {t("dont_share_code")}
                    </p>
                    {error && (
                      <p className="text-destructive text-sm">{error}</p>
                    )}

                    <div className="mt-5 text-center">
                      <p className="text-sm text-gray-500 font-base">
                        {currentMethod === "backup"
                          ? ""
                          : t("cant_access_code")}
                      </p>
                      <ul className="list-disc inline-flex justify-center w-full">
                        {alternativeMethods.map((method) => (
                          <li
                            key={method.id}
                            onClick={() => handleMethodChange(method.id)}
                            className="text-sm font-medium text-primary-500 hover:underline cursor-pointer"
                          >
                            {method.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
