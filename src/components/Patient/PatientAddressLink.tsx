import { ExternalLink } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

export const PatientAddressLink = ({ address }: { address?: string }) => {
  const { t } = useTranslation();
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = address?.match(urlRegex);

  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-col">
      {links.map((link) => (
        <Link
          href={link}
          key={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-1 items-center whitespace-nowrap underline"
        >
          <ExternalLink size={14} />
          {t("view_on_map")}
        </Link>
      ))}
    </div>
  );
};
