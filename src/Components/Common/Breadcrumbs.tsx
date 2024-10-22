import { usePath, Link } from "raviger";
import { Button } from "../ui/button";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useAppHistory from "../../Common/hooks/useAppHistory";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { useState } from "react";

const MENU_TAGS: { [key: string]: string } = {
  facility: "Facilities",
  patients: "Patients",
  assets: "Assets",
  sample: "Sample Tests",
  shifting: "Shiftings",
  resource: "Resources",
  users: "Users",
  notice_board: "Notice Board",
};

const capitalize = (string: string) =>
  string
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

interface BreadcrumbsProps {
  replacements?: {
    [key: string]: { name?: string; uri?: string; style?: string };
  };
  className?: string;
  hideBack?: boolean;
  backUrl?: string;
  onBackClick?: () => boolean | void;
}

export default function Breadcrumbs({
  replacements = {},
  className = "",
  hideBack = false,
  backUrl,
  onBackClick,
}: BreadcrumbsProps) {
  const { goBack } = useAppHistory();
  const path = usePath();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const crumbs =
    path
      ?.slice(1)
      .split("/")
      .map((field, i) => ({
        name: replacements[field]?.name || capitalize(field),
        uri:
          replacements[field]?.uri ||
          path
            .split("/")
            .slice(0, i + 2)
            .join("/"),
        style: replacements[field]?.style || "",
      })) || [];

  const toggleCrumbs = () => {
    setIsExpanded(!isExpanded); // Toggle the state
  };

  const renderCrumb = (crumb: any) => (
    <BreadcrumbItem key={crumb.uri}>
      <Link className="text-gray-500" href={crumb.uri}>
        {crumb.name}
      </Link>
      <BreadcrumbSeparator />
    </BreadcrumbItem>
  );

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Back Button */}
        {!hideBack && (
          <BreadcrumbItem>
            <Button
              variant="link"
              className="px-1 text-sm font-normal text-gray-500 underline underline-offset-2"
              size="sm"
              onClick={() => {
                if (onBackClick && onBackClick() === false) return;
                goBack(backUrl);
              }}
            >
              <CareIcon
                icon="l-angle-left"
                className="-ml-2 h-4 text-gray-400"
              />
              Back
            </Button>
            <span className="text-xs font-light text-gray-400 no-underline">
              |
            </span>
          </BreadcrumbItem>
        )}

        {/* Home Link */}
        <BreadcrumbItem>
          <Link href="/" className="text-gray-500">
            Home
          </Link>
          {crumbs.length > 2 ? null : <BreadcrumbSeparator />}
        </BreadcrumbItem>

        {/* For smaller screens, show ellipsis */}
        {crumbs.length > 2 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="md:hidden">
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    className="p-0 font-normal text-gray-500 hover:text-gray-700"
                  >
                    •••
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {crumbs.slice(1, -1).map((crumb) => (
                    <DropdownMenuItem key={crumb.uri}>
                      <Link href={crumb.uri} className="text-gray-500">
                        {crumb.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}

        {/* Render each crumb */}

        {crumbs.length > 2 && (
          <>
            {/* <BreadcrumbSeparator /> */}
            <div className="hidden gap-1 md:flex">
              {isExpanded ? (
                <>
                  {crumbs.slice(1, -1).map(renderCrumb)}
                  <Button
                    variant="link"
                    className="p-0 font-normal"
                    onClick={toggleCrumbs}
                  ></Button>
                </>
              ) : (
                <Button
                  variant="link"
                  className="p-0 font-normal"
                  onClick={toggleCrumbs}
                >
                  •••
                </Button>
              )}
            </div>

            {crumbs.length > 2 ? null : <BreadcrumbSeparator />}
          </>
        )}

        {/* Render the last crumb with truncation */}
        {crumbs.length > 2 && (
          <BreadcrumbPage className="text-gray-500">
            {/* Show full name on md size and above */}
            <span className="hidden md:inline">
              {crumbs[crumbs.length - 1]?.name}
            </span>

            {/* Show truncated name on smaller screens */}
            <span className="md:hidden">
              {crumbs[crumbs.length - 1]?.name.length > 15
                ? `${crumbs[crumbs.length - 1]?.name.slice(0, 15)}...`
                : crumbs[crumbs.length - 1]?.name}
            </span>
          </BreadcrumbPage>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
