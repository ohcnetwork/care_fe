import { Link } from "raviger";
import { FacilityModel } from "./models";
import { Avatar } from "@/Components/Common/Avatar";

export default function FacilityBlock(props: { facility: FacilityModel }) {
  const { facility } = props;

  return (
    <Link
      className="flex items-center gap-4 text-inherit"
      target="_blank"
      href={`/facility/${facility.id}`}
    >
      <div className="flex aspect-square h-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-400 bg-gray-200">
        {facility.read_cover_image_url ? (
          <img
            className="h-full w-full object-cover"
            src={facility.read_cover_image_url}
          />
        ) : (
          <Avatar name={facility.name!} square={true} />
        )}
      </div>
      <div>
        <b className="font-semibold">{facility.name}</b>
        <p className="text-sm">
          {facility.address} {facility.local_body_object?.name}
        </p>
      </div>
    </Link>
  );
}
