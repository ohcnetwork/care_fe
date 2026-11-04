import careConfig from "@careConfig";
import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AuthLayout } from "@/components/Auth/AuthLayout";
import { ForgotPassword } from "@/components/Auth/ForgotPassword";
import { PatientLoginForm } from "@/components/Auth/PatientLoginForm";
import { StaffLoginForm } from "@/components/Auth/StaffLoginForm";

import { LocalStorageKeys } from "@/common/constants";

type LoginMode = "staff" | "patient";

interface LoginProps {
  forgot?: boolean;
}

const Login = ({ forgot = false }: LoginProps) => {
  const { t } = useTranslation();
  const [{ mode }, setQueryParams] = useQueryParams<{ mode?: string }>();
  const [forgotPassword, setForgotPassword] = useState(forgot);
  // Shared so a username typed on the sign-in form carries into password reset.
  const [username, setUsername] = useState("");

  const activeMode: LoginMode =
    !careConfig.disablePatientLogin && mode === "patient" ? "patient" : "staff";

  // Remembered so the landing page's sign-in button reopens the same tab.
  useEffect(() => {
    localStorage.setItem(LocalStorageKeys.loginPreference, activeMode);
  }, [activeMode]);

  const staffPanel = forgotPassword ? (
    <ForgotPassword
      username={username}
      onUsernameChange={setUsername}
      onBack={() => setForgotPassword(false)}
    />
  ) : (
    <StaffLoginForm
      username={username}
      onUsernameChange={setUsername}
      onForgotPassword={() => setForgotPassword(true)}
    />
  );

  return (
    <AuthLayout>
      {careConfig.disablePatientLogin ? (
        staffPanel
      ) : (
        <Tabs
          value={activeMode}
          onValueChange={(value) => {
            setQueryParams({ mode: value });
            setForgotPassword(false);
          }}
          className="w-full gap-4"
        >
          <TabsList
            aria-label={t("sign_in_method")}
            className="h-12 w-full md:mt-4"
          >
            <TabsTrigger value="staff" className="min-h-11 text-base">
              {t("staff_sign_in")}
            </TabsTrigger>
            <TabsTrigger value="patient" className="min-h-11 text-base">
              {t("patient_sign_in")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="staff" className="flex-none">
            {staffPanel}
          </TabsContent>
          <TabsContent value="patient" className="flex-none">
            <PatientLoginForm />
          </TabsContent>
        </Tabs>
      )}
    </AuthLayout>
  );
};

export default Login;
