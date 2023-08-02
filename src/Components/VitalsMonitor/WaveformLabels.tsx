import { classNames } from "../../Utils/utils";

interface Props {
  labels: Record<string, string>;
}

export default function WaveformLabels({ labels }: Props) {
  return (
    <div className="absolute flex h-full flex-col items-start justify-between font-mono text-sm font-medium">
      {Object.entries(labels).map(([label, className]) => (
        <span className={classNames("flex flex-1 flex-col pt-1", className)}>
          {label}
        </span>
      ))}
    </div>
  );
}
