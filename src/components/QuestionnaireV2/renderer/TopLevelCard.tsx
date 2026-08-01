import { cn } from "@/lib/utils";

/**
 * Shell for every top-level question in the renderer — groups and plain
 * questions alike sit in the same light-gray bordered card with the indigo
 * accent bar, matching the design where the card treatment belongs to the
 * page position (depth 0), not the question type.
 */
export function TopLevelCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4",
        className,
      )}
    >
      <div className="h-4 w-1 shrink-0 rounded-full bg-indigo-500" />
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
    </div>
  );
}
