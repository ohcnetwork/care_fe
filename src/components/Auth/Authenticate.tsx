import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
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
import { Input } from "@/components/ui/input";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import authApi, { MFALoginRequest } from "@/types/auth/authApi";

export const Authenticate = () => {
  const { urls, stateLogo, customLogo, customLogoAlt } = careConfig;
  // Handle customDescriptionHtml as a separate variable since it might not exist in careConfig
  const customDescriptionHtml = (careConfig as any).customDescriptionHtml;
  const logos = [stateLogo, customLogo].filter(
    (logo) => logo?.light || logo?.dark,
  );
  const { t } = useTranslation();
  const [error, setError] = useState<string>("");
  const method = localStorage.getItem("mfa_method") || "totp";
  const [recoveryModal, setRecoveryModal] = useState(false);

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

  // MFA verification mutation
  const { mutate: verifyMFA, isPending } = useMutation({
    mutationFn: (data: MFALoginRequest) => {
      return mutate(authApi.mfa.login)(data);
    },
    onSuccess: async (data) => {
      localStorage.setItem(LocalStorageKeys.accessToken, data.access);
      localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
      localStorage.removeItem("mfa_temp_token");
      localStorage.removeItem("mfa_method");

      // Force reload the page to ensure the app picks up the new tokens
      window.location.href = "/";
    },
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit((values) => {
    if (!temp_token) {
      setError(t("session_expired"));
      navigate("/login");
      return;
    }

    // Verify MFA code
    verifyMFA({
      method: recoveryModal ? "backup" : method,
      code: values.code,
      temp_token,
    });
  });

  const accesWays: string[] = ["Use a recovery code"];
  const recoveryWays: string[] = ["Use authenticator app"];

  function handleRedirect(way: string): void {
    if (way === "Use a recovery code") {
      setRecoveryModal(true);
    } else if (way === "Use authenticator app") {
      setRecoveryModal(false);
    }
  }

  return (
    <div className="relative flex md:h-screen flex-col-reverse md:flex-row">
      {/* Hero Section */}
      <div className="login-hero relative flex flex-auto flex-col justify-between p-6 md:h-full md:w-[calc(50%+130px)] md:flex-none md:p-0 md:px-16 md:pr-[calc(4rem+130px)]">
        <div></div>
        <div className="mt-4 flex flex-col items-start rounded-lg py-4 md:mt-12">
          <div className="mb-4 hidden items-center gap-6 md:flex">
            {logos.map((logo, index) =>
              logo?.light ? (
                <div key={index} className="flex items-center">
                  <img
                    src={logo.light}
                    className="h-16 rounded-lg py-3"
                    alt="state logo"
                  />
                </div>
              ) : null,
            )}
            {logos.length === 0 && (
              <a
                href={urls.ohcn}
                className="inline-block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={customLogoAlt?.light ?? "/images/ohc_logo_light.svg"}
                  className="h-8"
                  alt="Open Healthcare Network logo"
                />
              </a>
            )}
          </div>
          <div className="max-w-lg">
            <h1 className="text-4xl font-black leading-tight tracking-wider text-white lg:text-5xl">
              {t("care")}
            </h1>
            {customDescriptionHtml ? (
              <div className="py-6">
                <div
                  className="max-w-xl text-secondary-400"
                  dangerouslySetInnerHTML={{
                    __html: customDescriptionHtml,
                  }}
                />
              </div>
            ) : (
              <div className="max-w-xl py-6 pl-1 text-base font-semibold text-secondary-400 md:text-lg lg:text-xl">
                {t("goal")}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6 flex items-center">
          <div className="max-w-lg text-xs md:text-sm">
            <div className="mb-2 ml-1 flex items-center gap-4">
              <a
                href="https://www.digitalpublicgoods.net/r/care"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img
                  src="https://cdn.ohc.network/dpg-logo.svg"
                  className="h-12"
                  alt="Logo of Digital Public Goods Alliance"
                />
              </a>
              <div className="ml-2 h-8 w-px rounded-full bg-white/50" />
              <a href={urls.ohcn} rel="noopener noreferrer" target="_blank">
                <img
                  src="/images/ohc_logo_light.svg"
                  className="inline-block h-10"
                  alt="Open Healthcare Network logo"
                />
              </a>
            </div>
            <a
              href={urls.ohcn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-500"
            >
              {t("footer_body")}
            </a>
            <div className="mx-auto mt-2">
              <a
                href={urls.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("contribute_github")}
              </a>
              <span className="mx-2 text-primary-400">|</span>
              <Link
                href="/licenses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-500"
              >
                {t("third_party_software_licenses")}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Login Forms Section */}
      <div className="login-hero-form my-4 w-full md:mt-0 md:h-full md:w-1/2">
        <div className="relative h-full items-center justify-center md:flex">
          <div className="w-full max-w-[400px] space-y-6">
            {/* Logo for Mobile */}
            <div className="px-4 flex items-center mx-auto gap-4 md:hidden">
              {logos.map((logo, index) =>
                logo?.dark ? (
                  <div key={index} className="flex items-center">
                    <img
                      src={logo.dark}
                      className="h-14 rounded-lg py-3"
                      alt="state logo"
                    />
                  </div>
                ) : null,
              )}
              {logos.length === 0 && (
                <a
                  href={urls.ohcn}
                  className="inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={customLogoAlt?.light ?? "/images/ohc_logo_light.svg"}
                    className="h-8"
                    alt="Open Healthcare Network logo"
                  />
                </a>
              )}
            </div>
            <Card className="mx-4">
              <CardHeader className="space-y-1 px-4">
                <CardTitle className="text-3xl font-bold w-15 text-black">
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
                            <Input
                              placeholder={
                                recoveryModal ? "XXXXXXXX" : "XXXXXX"
                              }
                              {...field}
                              maxLength={recoveryModal ? 8 : 6}
                              autoComplete="one-time-code"
                              className="tracking-[0.1em] placeholder:text-gray-500/50"
                            />
                          </FormControl>
                          <FormLabel className="mt-3">
                            {recoveryModal
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
                        isPending || codeValue.length < (recoveryModal ? 8 : 6)
                      }
                    >
                      {isPending ? t("verifying") : t("verify")}{" "}
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
                        {recoveryModal ? t("") : t("cant_access_code")}
                      </p>
                      <ul className="list-disc inline-flex justify-center w-full">
                        {(recoveryModal ? recoveryWays : accesWays).map(
                          (way: string, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm font-medium text-primary-500 hover:underline cursor-pointer"
                              onClick={() => handleRedirect(way)}
                            >
                              {way}
                            </li>
                          ),
                        )}
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
