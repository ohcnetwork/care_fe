import { Link } from "raviger";
import { FacilityModel } from "./models";
import { ReactNode } from "react";
import { Avatar } from "@/Components/Common/Avatar";

export default function FacilityBlock(props: {
  facility: FacilityModel;
  redirect?: boolean;
}) {
  const { facility, redirect = true } = props;

  const Element = (props: { children: ReactNode; className?: string }) =>
    redirect ? (
      <Link
        target="_blank"
        href={`/facility/${facility.id}`}
        className={props.className}
      >
        {props.children}
      </Link>
    ) : (
      <button className={props.className}>{props.children}</button>
    );

  return (
    <Element className="flex items-center gap-4 text-left text-inherit">
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
    </Element>
  );
}
