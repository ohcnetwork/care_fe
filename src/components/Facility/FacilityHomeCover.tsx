import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import type { FacilityRead } from "@/types/facility/facility";

interface FacilityHomeCoverProps {
  facility: FacilityRead;
  canUpdateFacility: boolean;
  onEditCoverImage: () => void;
}

export function FacilityHomeCover({
  facility: facilityData,
  canUpdateFacility,
  onEditCoverImage,
}: FacilityHomeCoverProps) {
  const { t } = useTranslation();
  return (
    <div className="group rounded-2xl relative h-64 w-full bg-linear-to-br from-emerald-400 via-emerald-500 to-emerald-600">
      {facilityData.read_cover_image_url ? (
        <>
          <img
            src={facilityData.read_cover_image_url}
            alt={facilityData.name}
            className="h-full w-full object-cover rounded-2xl"
          />
          <div className="absolute rounded-2xl inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent transition-opacity group-hover:opacity-70" />
        </>
      ) : (
        <div className="relative rounded-2xl  h-full w-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
      )}
      <div className="absolute bottom-0 left-0 translate-x-0 translate-y-1/3">
        <div className="sm:px-4 px-8 inline-flex rounded-xl">
          <Avatar
            name={facilityData.name}
            className="size-20 md:size-24 rounded-xl border-4 border-white shadow-lg"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 translate-x-0 ml-32">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0 mb-2">
            <div className="text-white">
              <TooltipComponent content={facilityData.name}>
                <h1 className="text-lg sm:text-sm md:text-2xl lg:text-3xl font-bold">
                  {facilityData.name}
                </h1>
              </TooltipComponent>
              <TooltipComponent
                content={facilityData.facility_type}
                side="right"
                align="center"
                sideOffset={4}
              >
                <h2 className="text-xs sm:text-sm md:text-base lg:text-base text-white/70 inline-block">
                  {facilityData.facility_type}
                </h2>
              </TooltipComponent>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 p-1 text-white [@media(max-width:55rem)]:top-0">
        {canUpdateFacility && (
          <Button
            variant="link"
            onClick={onEditCoverImage}
            aria-label={t("edit_cover_photo")}
            size="sm"
          >
            <CareIcon icon="l-pen" className="text-white" aria-hidden="true" />
            <span className="underline text-white">
              {t("edit_cover_photo")}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
