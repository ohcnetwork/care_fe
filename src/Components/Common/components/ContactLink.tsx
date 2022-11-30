type ContactLinkProps =
  | { mailto: string; tel?: undefined }
  | { mailto?: undefined; tel: string };

export default function ContactLink(props: ContactLinkProps) {
  return (
    <div>
      <a
        href={props.tel ? `tel:${props.tel}` : `mailto:${props.mailto}`}
        className=" tracking-wider text-base font-medium flex items-center gap-2 border-b border-blue-500 text-blue-500"
      >
        <i
          className={`uil ${
            props.tel ? "uil-outgoing-call" : "uil-envelope-alt"
          }`}
        ></i>
        {props.tel ? props.tel : props.mailto}
      </a>
    </div>
  );
}
