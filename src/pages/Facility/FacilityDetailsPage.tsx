import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { FacilityModel } from "@/components/Facility/models";
import { SkillObjectModel, UserAssignedModel } from "@/components/Users/models";

import useFilters from "@/hooks/useFilters";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { PaginatedResponse, RequestResult } from "@/Utils/request/types";

import { DoctorModel, FeatureBadge, mockDoctors } from "./Utils";
import { DoctorCard } from "./components/DoctorCard";

interface Props {
  id: string;
}

export function FacilityDetailsPage({ id }: Props) {
  const { data: facilityResponse, isLoading } = useQuery<
    RequestResult<FacilityModel>
  >({
    queryKey: ["facility", id],
    queryFn: () =>
      request(routes.getAnyFacility, {
        pathParams: { id },
      }),
  });
  const { Pagination } = useFilters({
    limit: 18,
  });

  const { data: docReponse } = useQuery<
    RequestResult<PaginatedResponse<UserAssignedModel>>
  >({
    queryKey: [routes.getFacilityUsers, id],
    queryFn: async () => {
      const response = await request(routes.getFacilityUsers, {
        pathParams: { facility_id: id },
        silent: true,
      });
      if (response.res?.status !== 200) {
        Notification.Error({ msg: "Error while fetching doctors data" });
      }
      return response;
    },
  });

  // To Do: Mock, remove/adjust this
  const createMockRole = (skills: SkillObjectModel[]) => {
    if (skills.length === 0) {
      return "General Practitioner";
    }
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    return randomSkill.name;
  };

  // To Do: Mock, remove/adjust this
  // Need to adjust DoctorModel to match the data from the backend
  function extendDoctors(doctors: UserAssignedModel[]): DoctorModel[] {
    const randomDoc =
      mockDoctors[Math.floor(Math.random() * mockDoctors.length)];
    return doctors.map((doctor) => ({
      ...doctor,
      role: createMockRole(doctor.skills),
      education: doctor.qualification ?? "",
      experience: doctor.doctor_experience_commenced_on?.toString() ?? "",
      languages: randomDoc.languages,
      read_profile_picture_url: doctor.read_profile_picture_url ?? "",
      skills: doctor.skills,
    }));
  }

  // To Do: Mock, remove/adjust this
  const doctors = extendDoctors(docReponse?.data?.results ?? []);
  doctors.push(...mockDoctors);

  const facility = facilityResponse?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin">
          <CareIcon icon="l-spinner" className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Facility Not Found</h2>
          <Button
            variant="outline"
            className="border border-secondary-400"
            onClick={() => navigate("/facilities")}
          >
            Back to Facilities
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex px-2 pb-4 justify-start">
        <Button
          variant="outline"
          asChild
          className="border border-secondary-400"
        >
          <Link href="/facilities">
            <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
            <span className="text-sm underline">Back</span>
          </Link>
        </Button>
      </div>
      <Card className="overflow-hidden bg-white">
        <div className="flex flex-col sm:flex-row  m-6">
          <div className="h-64 w-64 shrink-0 overflow-hidden rounded-lg">
            <img
              src={
                facility.read_cover_image_url || "/images/default-facility.png"
              }
              alt={facility.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="px-4 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{facility.name}</h1>
              <p className="text-lg text-muted-foreground">
                {[
                  facility.address,
                  facility.local_body_object?.name,
                  facility.district_object?.name,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {facility.features?.map((featureId) => (
                <FeatureBadge key={featureId} featureId={featureId as number} />
              ))}
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-6">
        {doctors.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 @xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 lg:grid-cols-2">
              {doctors?.map((doctor) => (
                <DoctorCard
                  key={doctor.username}
                  doctor={doctor}
                  facilityId={id}
                />
              ))}
            </div>
            <Pagination totalCount={doctors.length ?? 0} />
          </>
        )}
        {doctors.length === 0 && (
          <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
            <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
              No Doctors Found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
