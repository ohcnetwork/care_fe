import { HTMLAttributes, ReactNode } from "react";

/**
 * @deprecated Use the `Card` component from `@/components/ui/card` instead.
 */
export default function Card(
  props: {
    children?: ReactNode;
  } & HTMLAttributes<HTMLDivElement>,
) {
  const { children, ...rest } = props;
  return (
    <div
      {...rest}
      className={"rounded-lg bg-white p-4 shadow-sm " + props.className}
    >
      {children}
    </div>
  );
}
