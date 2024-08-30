import CareIcon from "../../CAREUI/icons/CareIcon";
import { FacilityModel } from "./models";

export default function FacilityBlock(props: { facility: FacilityModel }) {
  const { facility } = props;

  return (
    <div className="flex items-center gap-4">
      <div className="flex aspect-square h-14 items-center justify-center overflow-hidden rounded-lg border border-gray-400 bg-gray-200">
        {facility.read_cover_image_url ? (
          <img
            className="h-full w-full object-cover"
            src={facility.read_cover_image_url}
          />
        ) : (
          <>
            <CareIcon icon="l-hospital" />
          </>
        )}
      </div>
      <div>
        <b className="font-semibold">{facility.name}</b>
        <p className="text-sm">
          {facility.address} {facility.local_body_object?.name}
        </p>
      </div>
    </div>
  );
}
