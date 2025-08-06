import CareIcon from "@/CAREUI/icons/CareIcon";

type ContactLinkProps =
  | { mailto: string; tel?: undefined }
  | { mailto?: undefined; tel: string };

export default function ContactLink(props: ContactLinkProps) {
  return (
    <div>
      <a
        href={props.tel ? `tel:${props.tel}` : `mailto:${props.mailto}`}
        className="text-primary hover:underline flex items-center gap-1"
        aria-label={props.tel ? `Call ${props.tel}` : `Email ${props.mailto}`}
      >
        <CareIcon icon={props.tel ? "l-outgoing-call" : "l-envelope-alt"} />
        {props.tel ? props.tel : props.mailto}
      </a>
    </div>
  );
}
