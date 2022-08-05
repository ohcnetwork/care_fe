export function Badge(props: { color: string; icon: string; text: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-${props.color}-100 text-gray-700`}
      title={props.text}
    >
      <i
        className={
          "mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon
        }
      ></i>
      {props.text}
    </span>
  );
}
