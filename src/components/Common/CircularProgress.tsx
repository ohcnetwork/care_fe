import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  className?: string;
  children?: React.ReactNode;
}
export default function CircularProgress(props: CircularProgressProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <Spinner className={cn("size-8 text-primary", props.className)} />
      {props.children && (
        <span className="absolute inset-0 flex items-center justify-center">
          {props.children}
        </span>
      )}
    </span>
  );
}
