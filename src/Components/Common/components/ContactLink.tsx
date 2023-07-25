import CareIcon from "../../../CAREUI/icons/CareIcon";

type ContactLinkProps =
  | { mailto: string; tel?: undefined }
  | { mailto?: undefined; tel: string };

export default function ContactLink(props: ContactLinkProps) {
  return (
    <div>
      <a
        href={props.tel ? `tel:${props.tel}` : `mailto:${props.mailto}`}
        className=" flex items-center gap-2 border-b border-blue-500 text-base font-medium tracking-wider text-blue-500"
      >
        <CareIcon
          className={`care-l-${
            props.tel ? "outgoing-call" : "envelope-alt"
          } h-5 fill-gray-700`}
        />
        {props.tel ? props.tel : props.mailto}
      </a>
    </div>
  );
}
