/* eslint-disable i18next/no-literal-string */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useState } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import {
  LocationList as LocationListType,
  getLocationFormLabel,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";
import { LocationChildren } from "./components/LocationChildren";

interface Props {
  facilityId: string;
}

export default function LocationList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationListType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useView("users", "card");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["locations", facilityId, searchQuery],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: "",
        name: searchQuery || undefined,
      },
    }),
  });

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
  };

  return (
    <div className="space-y-6">
      <div className="">
        <h2 className="text-lg font-semibold mb-2">{t("locations")}</h2>
        <div className="flex justify-between items-center gap-4 w-full ">
          <div className="flex items-center gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "card" | "list")}
              className="ml-auto"
            >
              <TabsList className="flex">
                <TabsTrigger value="card" id="user-card-view">
                  <div className="flex items-center gap-2">
                    <CareIcon icon="l-credit-card" className="text-lg" />
                    <span>{t("card")}</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="list" id="user-list-view">
                  <div className="flex items-center gap-2">
                    <CareIcon icon="l-list-ul" className="text-lg" />
                    <span>{t("list")}</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="w-72">
              <Input
                placeholder={t("filter_location")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full"
              />
            </div>
          </div>

          <Button variant="primary" onClick={handleAddLocation}>
            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
            {t("add_location")}
          </Button>
        </div>
      </div>
      <div className="flex items-center  gap-2 p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <div className="text-blue-500">
          <CareIcon icon="l-exclamation-octagon" className="w-6 h-6 mr-2" />
        </div>
        <div className="text-sm text-blue-900">
          <p>
            Click <span className="font-semibold">"Add Location"</span> to add a
            main location.
            <br />
            Hover or focus to reveal{" "}
            <span className="font-semibold">"See Details"</span>, which opens a
            page for managing sub-locations.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <div className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow className="divide-x bg-gray-100">
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("location_form")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data?.results.map((location) => (
                <React.Fragment key={location.id}>
                  <TableRow
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(
                        selectedLocation?.id === location.id ? null : location,
                      );
                    }}
                    className="divide-x font-medium cursor-pointer bg-white dark:bg-gray-900"
                  >
                    <TableCell className="pl-4 font-bold flex justify-between items-center cursor-pointer group">
                      {/* Left Section: Icon & Name */}
                      <div className="flex items-center">
                        <CareIcon
                          icon={
                            selectedLocation?.id === location.id
                              ? "l-angle-down"
                              : "l-angle-right-b"
                          }
                          className="w-5 h-5"
                        />
                        <span className="ml-2">{location.name}</span>
                      </div>

                      {/* Right Section: Button */}
                      <div className="flex">
                        <Button
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto"
                          onClick={() => navigate(`/location/${location.id}`)}
                        >
                          <CareIcon icon="l-eye" className="w-4 h-5 mr-2" />
                          See Details
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getLocationFormLabel(location?.form)}
                    </TableCell>
                  </TableRow>

                  {/* Recursive Child Rendering */}
                  {selectedLocation?.id === location.id &&
                  location.has_children ? (
                    <LocationChildren
                      facilityId={facilityId}
                      location={location}
                      level={0}
                    />
                  ) : null}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <LocationSheet
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        facilityId={facilityId}
        location={selectedLocation || undefined}
      />
    </div>
  );
}
