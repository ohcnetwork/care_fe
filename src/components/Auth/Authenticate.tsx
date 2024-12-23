import careConfig from "@careConfig";
import { t } from "i18next";
import { Link } from "raviger";
import { useState } from "react";

import Card from "@/CAREUI/display/Card";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Authenticate = () => {
  const { urls, stateLogo, customLogo, customLogoAlt } = careConfig;
  const customDescriptionHtml = __CUSTOM_DESCRIPTION_HTML__;
  const logos = [stateLogo, customLogo].filter(
    (logo) => logo?.light || logo?.dark,
  );
  const [recoveryModal, setRecoveryModal] = useState(false);

  const accesWays: string[] = [
    "OTP via SMS",
    "OTP via Email",
    "Use a recovery code",
  ];
  function handleRedirect(way: string): void {
    if (way === "Use a recovery code") {
      setRecoveryModal(true);
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
              logo && logo.light ? (
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
                    __html: __CUSTOM_DESCRIPTION_HTML__,
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
                logo && logo.dark ? (
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
                  Authenticate Your Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!recoveryModal ? (
                  <form>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      className=""
                      placeholder="XXXXXX"
                    />
                    <Label className="mt-3" htmlFor="otp">
                      Enter code generated by by your 2-factor auth app
                    </Label>
                    <Button
                      type="submit"
                      className="w-full mt-4"
                      variant="primary"
                    >
                      Verify
                    </Button>
                    <p className="text-sm text-red-500 font-base mt-3">
                      Dont share this verification code with anyone!
                    </p>

                    <div className="mt-5">
                      <p className="text-sm text-gray-500 font-base">
                        Can't you access your code?
                      </p>
                      <ul className="mt-1 w-full inline-flex flex-wrap justify-center items-center gap-1">
                        {accesWays.map((way: string) => (
                          <li
                            className="text-sm font-medium text-primary-500"
                            value={way}
                            onClick={() => handleRedirect(way)}
                          >
                            {way}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </form>
                ) : (
                  <form>
                    <Label className="mb-3" htmlFor="otp">
                      Recovery Code
                    </Label>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      className=""
                      placeholder="XXXXXXXX"
                    />
                    <Label className="mt-3" htmlFor="otp">
                      Enter your 8-digit recovery code
                    </Label>
                    <Button
                      type="submit"
                      className="w-full mt-4"
                      variant="primary"
                    >
                      Verify
                    </Button>
                    <p className="text-sm text-rose-500 font-base mt-3">
                      Dont share this verification code with anyone!
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
