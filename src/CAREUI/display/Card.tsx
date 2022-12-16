export default function Card(
  props: {
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const { children, ...rest } = props;
  return (
    <div
      {...rest}
      className={"bg-white rounded-lg shadow p-4 " + props.className}
    >
      {children}
    </div>
  );
}
