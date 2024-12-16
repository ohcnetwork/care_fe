import { cn } from "@/lib/utils";

const colorForID = (id: string | undefined, pallete: string[]) => {
  if (!id) return "bg-zinc-200";

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pallete[Math.abs(hash) % pallete.length];
};

interface Props {
  id?: string;
  pallete?: string[];
  className?: string;
}

/**
 * Returns a div with a background color from the pallete based on specified `id`.
 * Just to consistently get back the same color for a given id.
 */
export default function ColoredIndicator(props: Props) {
  return (
    <div
      className={cn(
        props.className,
        colorForID(
          props.id,
          props.pallete ?? [
            "bg-amber-600",
            "bg-blue-600",
            "bg-purple-500",
            "bg-red-500",
            "bg-red-700",
            "bg-primary-300",
            "bg-primary-500",
            "bg-zinc-600",
          ],
        ),
      )}
    />
  );
}
