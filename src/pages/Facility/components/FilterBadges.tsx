import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DistrictModel, LocalBodyModel } from "@/components/Facility/models";

interface Props {
  district?: DistrictModel;
  localBody?: LocalBodyModel;
  onRemove: (key: keyof FilterKeys) => void;
}

type FilterKeys = {
  district?: string;
  local_body?: string;
};

export function FilterBadges({ district, localBody, onRemove }: Props) {
  return (
    <div className="flex gap-2">
      {district && (
        <Badge
          variant="secondary"
          className="flex items-center gap-2 px-3 py-1"
        >
          {district.name}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove("district")}
          >
            <CareIcon icon="l-times" className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      {localBody && (
        <Badge
          variant="secondary"
          className="flex items-center gap-2 px-3 py-1"
        >
          {localBody.name}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove("local_body")}
          >
            <CareIcon icon="l-times" className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}
