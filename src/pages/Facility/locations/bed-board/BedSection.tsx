import { useTranslation } from "react-i18next";

import { LocationRead } from "@/types/location/location";

import { BedTile } from "./BedTile";

interface BedSectionProps {
  facilityId: string;
  beds: LocationRead[];
}

export function BedSection({ facilityId, beds }: BedSectionProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("beds")}>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
        {beds.map((bed) => (
          <BedTile key={bed.id} bed={bed} facilityId={facilityId} />
        ))}
      </ul>
    </section>
  );
}
