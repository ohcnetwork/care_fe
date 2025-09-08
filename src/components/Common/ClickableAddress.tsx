import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

export const ClickableAddress = ({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) => {
  const { t } = useTranslation();
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = address?.match(urlRegex);

  const addressText = address?.replace(urlRegex, "").trim();
  return (
    <div
      className={cn(className || "flex items-end justify-between gap-2 w-full")}
    >
      {addressText && (
        <span className="text-gray-950 my-auto whitespace-break-spaces">
          {addressText}
        </span>
      )}
      {links && links.length > 0 && (
        <div className="flex flex-col">
          {links.map((link) => (
            <Link
              href={link}
              key={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 items-center whitespace-nowrap"
            >
              <ExternalLink size={14} />
              {t("view_on_map")}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
