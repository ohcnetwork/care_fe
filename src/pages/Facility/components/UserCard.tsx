import { navigate } from "raviger";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { UserAssignedModel } from "@/components/Users/models";

import { formatName } from "@/Utils/utils";

interface Props {
  user: UserAssignedModel;
  className?: string;
  facilityId: string;
}

export function UserCard({ user, className, facilityId }: Props) {
  const name = formatName({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
  });

  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col justify-between h-full">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar
              imageUrl={user.read_profile_picture_url}
              name={name}
              className="h-32 w-32"
            />

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-xl font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{user.user_type}</p>

              {user.qualification && (
                <>
                  <p className="text-xs mt-3">Education: </p>
                  <p className="text-sm text-muted-foreground">
                    {user.qualification}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-y-2">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("user", JSON.stringify(user));
                navigate(
                  `/facility/${facilityId}/appointments/${user.external_id}/otp/send`,
                );
              }}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
