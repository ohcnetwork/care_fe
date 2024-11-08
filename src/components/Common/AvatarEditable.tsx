import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar, AvatarProps } from "@/components/Common/Avatar";

interface AvatarEditableProps extends AvatarProps {
  id?: string;
  editable?: boolean;
  onClick?: () => void;
}

const AvatarEditable: React.FC<AvatarEditableProps> = ({
  id,
  colors: propColors,
  name,
  imageUrl,
  className,
  editable = true,
  onClick,
}) => {
  const { t } = useTranslation();
  return (
    <div
      id={id}
      className={cn(
        `group grid aspect-square h-full w-full place-items-center text-clip transition-all duration-200 ease-in-out [grid-template-areas:'stack']`,
        editable && "cursor-pointer",
        className,
      )}
    >
      <Avatar
        imageUrl={imageUrl}
        name={name}
        colors={propColors}
        className="flex h-full w-full [grid-area:stack]"
      />

      {editable && (
        <div
          className={
            "flex h-full w-full cursor-pointer flex-col items-center justify-center bg-black text-sm text-secondary-300 opacity-0 transition-opacity [grid-area:stack] hover:opacity-60"
          }
          style={{ borderRadius: "calc(100% / 15)" }}
          onClick={onClick}
        >
          <CareIcon icon="l-pen" className="text-lg" />
          <span className="mt-2">{t(imageUrl ? "edit" : "upload")}</span>
        </div>
      )}
    </div>
  );
};

export default AvatarEditable;
