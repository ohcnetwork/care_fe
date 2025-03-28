import { PenLine } from "lucide-react";
import { Trans } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

export function LocationInfoCard() {
  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <div className="flex gap-3">
        <div className="p-2 bg-blue-100 rounded-sm shrink-0 self-center">
          <CareIcon icon="l-info-circle" className="size-5 text-blue-900" />
        </div>
        <div className="min-w-0 space-y-2 text-xs md:text-sm text-blue-800">
          <div className="flex flex-wrap items-center">
            <Trans
              i18nKey="click_add_main_location"
              components={{
                strong: <strong className="font-semibold mx-1" />,
              }}
            />
          </div>
          <div className="hidden lg:flex items-center">
            <Trans
              i18nKey="click_manage_sub_locations"
              components={{
                ArrowIcon: (
                  <CareIcon icon="l-arrow-up-right" className="size-4 mr-1" />
                ),
                strong: <strong className="font-semibold ml-1" />,
              }}
            />
          </div>
          <div className="lg:hidden flex flex-wrap items-center">
            <Trans
              i18nKey="click_manage_sub_locations_mobile"
              components={{
                ArrowIcon: (
                  <CareIcon icon="l-arrow-up-right" className="size-4 mx-1" />
                ),
                PenLine: <PenLine className="size-4 mx-1" />,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
