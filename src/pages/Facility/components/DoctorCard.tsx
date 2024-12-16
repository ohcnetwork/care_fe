import { navigate } from "raviger";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import { formatName } from "@/Utils/utils";
import { DoctorModel, getExperience } from "@/pages/Facility/Utils";

interface Props {
  doctor: DoctorModel;
  className?: string;
  facilityId: string;
}

export function DoctorCard({ doctor, className, facilityId }: Props) {
  const name = formatName({
    first_name: doctor.first_name || "",
    last_name: doctor.last_name || "",
  });

  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col justify-between h-full">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar
              imageUrl={doctor.read_profile_picture_url}
              name={name}
              className="h-32 w-32"
            />

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-xl font-semibold">
                {doctor.user_type === "Doctor" ? `Dr. ${name}` : name}
              </h3>
              <p className="text-sm text-muted-foreground">{doctor.role}</p>

              {doctor.education && (
                <>
                  <p className="text-xs mt-3">Education: </p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.education}
                  </p>
                </>
              )}

              <p className="text-xs mt-3">Languages: </p>
              <p className="text-sm text-muted-foreground">
                {doctor.languages.join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-y-2">
            <div className="text-sm text-muted-foreground">
              {getExperience(doctor)}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem("doctor", JSON.stringify(doctor));
                navigate(
                  `/facility/${facilityId}/appointments/${doctor.username}/otp/send`,
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
