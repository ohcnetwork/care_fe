import dayjs from "dayjs";
import { t } from "i18next";
import { navigate } from "raviger";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import { useAuthContext } from "@/hooks/useAuthUser";

import { formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

interface Props {
  user: UserBase;
  className?: string;
  facilityId: string;
}

export function UserCard({ user, className, facilityId }: Props) {
  const { patientToken: tokenData } = useAuthContext();

  const returnLink = useMemo(() => {
    if (
      tokenData &&
      Object.keys(tokenData).length > 0 &&
      dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"))
    ) {
      return `/facility/${facilityId}/appointments/${user.id}/book-appointment`;
    }
    return `/facility/${facilityId}/appointments/${user.id}/otp/send`;
  }, [tokenData, facilityId, user.id]);

  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col justify-between h-full">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar
              imageUrl={user.profile_picture_url}
              name={formatName(user, true)}
              className="size-32 rounded-lg"
            />

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-xl font-semibold">
                {formatName(user)}
              </h3>
              <p className="text-sm text-gray-500">{user.user_type}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-y-2">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("user", JSON.stringify(user));
                navigate(returnLink);
              }}
            >
              {t("book_appointment")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
