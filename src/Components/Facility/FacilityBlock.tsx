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
      <div className="flex aspect-square h-14 shrink-0 items-center justify-center overflow-hidden">
        <Avatar
          name={facility.name!}
          imageUrl={facility.read_cover_image_url}
        />
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
