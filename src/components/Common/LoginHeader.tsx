import dayjs from "dayjs";
import { ChevronDown, LogOut, User } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuthContext } from "@/hooks/useAuthUser";

export const LoginHeader = () => {
  const { t } = useTranslation();
  const { signOut, patientToken } = useAuthContext();

  const isLoggedIn =
    !!patientToken?.token &&
    dayjs(patientToken.createdAt).isAfter(dayjs().subtract(14, "minutes"));

  const phone = patientToken?.phoneNumber
    ? formatPhoneNumberIntl(patientToken.phoneNumber) ||
      patientToken.phoneNumber
    : "";

  if (isLoggedIn) {
    return (
      <header className="flex w-full items-center justify-end gap-2">
        <Button
          variant="ghost"
          className="min-h-11 rounded-full px-4 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          onClick={() => navigate("/patient/home")}
        >
          {t("home")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-3 hover:border-gray-300"
            >
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white"
              >
                <User className="size-3.5" strokeWidth={2.2} />
              </span>
              <ChevronDown
                className="size-3.5 text-gray-600"
                strokeWidth={2.2}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel className="text-xs font-semibold text-gray-500">
              {phone}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={signOut}
            >
              <LogOut className="mr-2 size-4" />
              {t("sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    );
  }

  return (
    <header className="flex w-full items-center justify-end">
      <Button
        className="rounded-full px-6 text-sm font-semibold"
        onClick={() => navigate("/patient/login")}
      >
        {t("sign_in")}
      </Button>
    </header>
  );
};
