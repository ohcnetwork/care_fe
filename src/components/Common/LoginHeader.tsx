import dayjs from "dayjs";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { usePatientSignOut } from "@/hooks/usePatientSignOut";

import { LocalStorageKeys } from "@/common/constants";

import { TokenData } from "@/types/auth/otpToken";

export const LoginHeader = () => {
  const { t } = useTranslation();
  const signOut = usePatientSignOut();

  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(LocalStorageKeys.patientTokenKey) || "{}",
  );

  const isLoggedIn =
    tokenData.token &&
    Object.keys(tokenData).length > 0 &&
    dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"));

  if (isLoggedIn) {
    const phoneNumber = tokenData.phoneNumber?.replace("+91", "") || "";
    const initials = phoneNumber.slice(-2);

    return (
      <header className="w-full">
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            className="text-sm font-medium hover:bg-gray-100 rounded-full px-6"
            onClick={() => navigate("/patient/home")}
          >
            {t("dashboard")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full p-0 hover:bg-gray-100 border-gray-400 border-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-50 text-primary-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-gray-500">
                <span className="font-medium">{tokenData.phoneNumber}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={signOut}
              >
                <CareIcon icon="l-signout" className="mr-2 h-4 w-4" />
                {t("sign_out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full">
      <div className="flex justify-end items-center">
        <Button
          variant="ghost"
          className="text-sm font-medium hover:bg-gray-100 rounded-full px-6"
          onClick={() => navigate("/login?mode=patient")}
        >
          {t("sign_in")}
        </Button>
      </div>
    </header>
  );
};
