import { classNames } from "../../Utils/utils";

interface Props {
  labels: Record<string, string>;
}

export default function WaveformLabels({ labels }: Props) {
  return (
    <div className="absolute flex h-full flex-col justify-between items-start font-mono font-medium text-sm">
      {Object.entries(labels).map(([label, className]) => (
        <span className={classNames("flex-1 flex flex-col pt-1", className)}>
          {label}
        </span>
      ))}
    </div>
  );
}
