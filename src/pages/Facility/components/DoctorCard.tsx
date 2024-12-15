import { Link } from "raviger";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { DoctorModel, getExperience } from "@/pages/Facility/Utils";

interface Props {
  doctor: DoctorModel;
  className?: string;
  facilityId: string;
}

export function DoctorCard({ doctor, className, facilityId }: Props) {
  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg">
              <img
                src={
                  doctor.read_profile_picture_url ||
                  "/images/default-doctor.png"
                }
                alt={`${doctor.first_name} ${doctor.last_name}`}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-xl font-semibold">
                {`Dr. ${doctor.first_name} ${doctor.last_name}`}
              </h3>
              <p className="text-sm text-muted-foreground">{doctor.role}</p>

              <p className="text-xs mt-3">Education: </p>
              <p className="text-sm text-muted-foreground">
                {doctor.education}
              </p>

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
            <Button variant="outline" asChild>
              <Link
                href={`/facility/${facilityId}/appointments/${doctor.username}/otp/send`}
              >
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
