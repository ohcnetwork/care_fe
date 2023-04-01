export default function CardV2(props: {
  children: JSX.Element | JSX.Element[];
  className?: string;
  raised?: "sm" | "md" | "lg" | "xl" | "2xl" | "inner";
  border?: boolean;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}) {
  return (
    <div
      className={`${props.className}  bg-white p-5 ${
        props.rounded ? `rounded-${props.rounded}` : "rounded-lg"
      } ${props.raised ? `shadow-${props.raised}` : "shadow-md"} ${
        props.border ? "border border-gray-200" : ""
      }`}
    >
      {props.children}
    </div>
  );
}
