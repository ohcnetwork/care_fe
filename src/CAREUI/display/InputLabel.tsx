export default function InputLabel(
  props: {
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const { children, ...rest } = props;
  return (
    <div {...rest} className={"text-[#757575] font-medium" + props.className}>
      {children}
    </div>
  );
}
