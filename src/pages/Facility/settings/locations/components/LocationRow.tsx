import { PenLine } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

import useBreakpoints from "@/hooks/useBreakpoints";

import { LocationList as LocationListType } from "@/types/location/location";
import { getLocationFormLabel } from "@/types/location/location";

interface LocationRowProps {
  location: LocationListType;
  expandedRows: Record<string, boolean>;
  toggleRow: (id: string) => void;
  getChildren: (parentId: string) => LocationListType[];
  indent: number;
  onEdit: (location: LocationListType) => void;
  setExpandedRows: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

export function LocationRow({
  location,
  expandedRows,
  toggleRow,
  getChildren,
  indent,
  onEdit,
  setExpandedRows,
}: LocationRowProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const children = getChildren(location.id);
  const isTopLevel =
    !location.parent || Object.keys(location.parent).length === 0;
  const isExpanded = expandedRows[location.id];

  const toggleAllChildren = () => {
    setExpandedRows((prevExpandedRows) => {
      const newExpandedRows = { ...prevExpandedRows };
      const toggleChildren = (parentId: string, expand: boolean) => {
        getChildren(parentId).forEach((child) => {
          newExpandedRows[child.id] = expand;
          toggleChildren(child.id, expand);
        });
      };
      const shouldExpand = !children.every(
        (child) => prevExpandedRows[child.id],
      );
      newExpandedRows[location.id] = shouldExpand;
      toggleChildren(location.id, shouldExpand);
      return newExpandedRows;
    });
  };

  const allExpanded = children.every((child) => expandedRows[child.id]);

  return (
    <>
      <TableRow
        className="group hover:bg-muted/50"
        style={{ "--indent": `${indent}rem` } as React.CSSProperties}
      >
        <TableCell
          className={`${
            isTopLevel
              ? "bg-white font-bold text-gray-900"
              : "bg-white font-medium text-gray-900"
          } flex justify-between lg:flex-row flex-col pl-[var(--indent)] flex-wrap gap-2`}
        >
          <div className="flex items-center">
            {isTopLevel || children.length > 0 ? (
              <Button
                size="icon"
                variant="link"
                onClick={() => toggleRow(location.id)}
                disabled={children.length === 0}
              >
                {isExpanded ? (
                  <CareIcon icon="l-angle-down" className="h-5 w-5" />
                ) : (
                  <CareIcon icon="l-angle-right" className="h-5 w-5" />
                )}
              </Button>
            ) : location.parent ? (
              <CareIcon
                icon="l-corner-down-right-alt"
                className="h-4 w-4 text-gray-400 ml-4 mr-2"
              />
            ) : (
              <div className="w-8" />
            )}
            {location.name}
          </div>
          {isTopLevel && (
            <div className="flex justify-between items-center gap-2">
              <div className="flex-1">
                {children.length > 0 && (
                  <Button
                    variant="white"
                    size={isMobile ? "xs" : "sm"}
                    onClick={toggleAllChildren}
                    className="gap-2"
                  >
                    <CareIcon
                      icon={allExpanded ? "l-minus" : "l-plus"}
                      className="h-4 w-4"
                    />
                    <span className="hidden lg:inline">
                      {t(allExpanded ? "collapse_all" : "expand_all")}
                    </span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="white"
                  size={isMobile ? "xs" : "sm"}
                  onClick={() => onEdit(location)}
                >
                  <PenLine className="h-4 w-4" />
                  <span className="hidden lg:inline">{t("edit")}</span>
                </Button>

                <Button variant="white" size={isMobile ? "xs" : "sm"} asChild>
                  <Link
                    href={`/location/${location.id}`}
                    className="text-gray-900 flex items-center"
                  >
                    <CareIcon icon="l-arrow-up-right" className="h-4 w-4" />
                    <span className="hidden lg:inline">{t("see_details")}</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell border-l bg-white font-semibold text-gray-900">
          {getLocationFormLabel(location.form)}
        </TableCell>
      </TableRow>
      {isExpanded &&
        children.map((child) => (
          <LocationRow
            key={child.id}
            location={child}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            getChildren={getChildren}
            indent={indent + 1}
            onEdit={onEdit}
            setExpandedRows={setExpandedRows}
          />
        ))}
    </>
  );
}
