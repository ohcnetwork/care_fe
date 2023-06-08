export default function CardContent(
  props: {
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const { children, ...rest } = props;
  return (
    <div {...rest} className={"p-4 " + props.className}>
      {children}
    </div>
  );
}
