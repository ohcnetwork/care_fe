import { Markdown } from "@/components/ui/markdown";

export const ClickableAddress = ({ address }: { address: string }) => {
  return (
    <div
      className="[&_a]:text-sky-600 [&_a]:underline [&_a]:hover:text-sky-300 break-words overflow-wrap-anywhere"
      onClick={(e) => {
        if (e.target instanceof HTMLAnchorElement && e.target.href) {
          e.preventDefault();
          window.open(e.target.href, "_blank", "noopener,noreferrer");
        }
      }}
    >
      <Markdown content={address || ""} prose={false} />
    </div>
  );
};
