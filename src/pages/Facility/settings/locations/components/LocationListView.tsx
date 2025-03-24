import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

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
  displayExpandAll?: boolean;
  facilityId: string;
}

function LocationRow({
  location,
  expandedRows,
  toggleRow,
  getChildren,
  indent,
  onEdit,
  setExpandedRows,
  displayExpandAll = true,
  facilityId,
}: LocationRowProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
  const { mutate: removeLocation } = useMutation({
    mutationFn: mutate(locationApi.delete, {
      pathParams: { facility_id: facilityId, id: location.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["locations", facilityId],
      });
      toast.success(t("location_removed_successfully"));
    },
  });

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
                {children.length > 0 && displayExpandAll && (
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
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="white"
                      size={isMobile ? "xs" : "sm"}
                      className="gap-2"
                      disabled={
                        location.has_children || !!location.current_encounter
                      }
                    >
                      <CareIcon icon={"l-trash"} className="h-4 w-4" />
                      <span className="hidden lg:inline">{t("delete")}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("remove_location", { name: location.name })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("are_you_sure_want_to_delete", {
                          name: location.name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeLocation({})}
                        className={buttonVariants({ variant: "destructive" })}
                      >
                        {t("remove")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
          {t(`location_form__${location.form}`)}
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
            facilityId={facilityId}
          />
        ))}
    </>
  );
}

interface LocationListViewProps {
  isLoading: boolean;
  tableData: LocationListType[];
  searchQuery: string;
  filteredTopLevelLocations: LocationListType[];
  expandedRows: Record<string, boolean>;
  toggleRow: (id: string) => void;
  getChildren: (parentId: string) => LocationListType[];
  handleEditLocation: (location: LocationListType) => void;
  setExpandedRows: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  facilityId: string;
}

export function LocationListView({
  isLoading,
  tableData,
  searchQuery,
  filteredTopLevelLocations,
  expandedRows,
  toggleRow,
  getChildren,
  handleEditLocation,
  setExpandedRows,
  facilityId,
}: LocationListViewProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={6} />;
  }

  if (!tableData?.length) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center text-gray-500">
          {searchQuery ? t("no_locations_found") : t("no_locations_available")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Table className="border rounded-lg w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%] border text-gray-700 bg-gray-200">
              {t("name")}
            </TableHead>
            <TableHead className="hidden sm:table-cell bg-gray-200 text-gray-700">
              {t("location_form")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTopLevelLocations.map((location) => (
            <LocationRow
              key={location.id}
              location={location}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getChildren={getChildren}
              indent={1}
              onEdit={handleEditLocation}
              setExpandedRows={setExpandedRows}
              displayExpandAll={searchQuery ? false : true}
              facilityId={facilityId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
