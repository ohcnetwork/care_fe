import { HTMLAttributes, ReactNode } from "react";

export default function Card(
  props: {
    children?: ReactNode;
  } & HTMLAttributes<HTMLDivElement>
) {
  const { children, ...rest } = props;
  return (
    <div
      {...rest}
      className={"rounded-lg bg-white p-4 shadow " + props.className}
    >
      {children}
    </div>
  );
}
