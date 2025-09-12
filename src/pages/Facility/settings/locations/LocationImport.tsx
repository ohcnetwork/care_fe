import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronRight, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

import mutate from "@/Utils/request/mutate";
import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import {
  LocationDetail,
  LocationForm,
  LocationImport as LocationImportT,
  LocationTypeIcons,
  LocationWrite,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationImportProps {
  facilityId: string;
}

const LocationFormLabels = {
  bed: "bd",
  building: "bu",
  cabinet: "ca",
  corridor: "co",
  house: "ho",
  jurisdiction: "jdn",
  level: "lvl",
  road: "rd",
  room: "ro",
  site: "si",
  vehicle: "ve",
  virtual: "vi",
  ward: "wa",
  wing: "wi",
};

const mapLabelToForm = (label: string): LocationForm | undefined => {
  const formKey = LocationFormLabels[label as keyof typeof LocationFormLabels];
  console.log("Mapping label", label, "to form", formKey);
  return formKey as LocationForm | undefined;
};

const processRowLocations = (data: string[][]) => {
  let locations: LocationImportT[] = [];
  const processAtLocation = (
    locationData: string[],
    locations: LocationImportT[],
  ): LocationImportT[] => {
    console.log("Processing location:", locationData);
    const [location, location_type, description] = locationData.slice(0, 3);
    const tail = locationData.slice(3);

    const existingLocation = locations.find((l) => l.name === location);

    if (existingLocation && tail.length > 0 && tail[0] !== "") {
      console.log("Processing new children for location:", location);
      return [
        ...locations.filter((l) => l.name !== location),
        {
          ...existingLocation,
          children: processAtLocation(tail, existingLocation.children),
        },
      ];
    } else {
      const locationForm = mapLabelToForm(location_type?.toLowerCase()) || "ro";
      const newLocation: LocationImportT = {
        name: location,
        form: locationForm,
        mode: locationForm === "bd" ? "instance" : "kind",
        status: "active",
        operational_status: "C",
        description,
        children: [],
      };
      let children: LocationImportT[] = [];
      console.log("Adding new location:", newLocation);
      if (tail.length > 0 && tail[0] != "") {
        console.log("Processing children for location:", location);
        children = processAtLocation(tail, newLocation.children);
      }
      return [
        ...locations,
        {
          ...newLocation,
          children,
        },
      ];
    }
  };

  for (const locationRow of data) {
    locations = processAtLocation(locationRow, locations);
  }

  console.log(locations);
  return locations;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export default function LocationImport({ facilityId }: LocationImportProps) {
  const [processedLocations, setProcessedLocations] = useState<
    LocationImportT[]
  >([]);
  const [currentStep, setCurrentStep] = useState<"upload" | number | "review">(
    "upload",
  );
  const [uploadError, setUploadError] = useState<string>("");
  const { saveLocations } = useSaveLocations(facilityId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setUploadError("Please upload a valid CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = csvText.split("\n");
        const headers = rows[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        // Validate headers - must have groups of 3 columns (location, type, description)
        if (headers.length < 3 || headers.length % 3 !== 0) {
          console.error(
            `CSV validation failed: ${headers.length} columns found, expected multiple of 3`,
          );
          console.error("Headers:", headers);
          setUploadError(
            "CSV format is invalid. Expected groups of 3 columns: location, type, description",
          );
          return;
        }

        let data: string[][] = [];

        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim()) {
            const values = rows[i]
              .split(",")
              .map((v) => v.trim().replace(/"/g, ""));

            if (values.length >= headers.length) {
              data.push(values);
            }
          }
        }

        setUploadError("");
        setProcessedLocations(processRowLocations(data));
        setCurrentStep("review");
      } catch (error) {
        console.error("=== CSV PROCESSING ERROR ===");
        console.error("Error details:", error);
        console.error("=== END ERROR LOG ===");
        setUploadError("Error processing CSV file");
      }
    };
    reader.readAsText(file);
  };

  if (currentStep === "upload") {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Locations from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file to import floor, room, and sub-room locations
              with their hierarchy preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      Click to upload CSV file
                    </p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Expected columns: location, type, description (repeated for
                    each hierarchy level)
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Location types can use labels like "bed", "room", "ward",
                    etc. The last description column is optional.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sampleCSV = `Building,type,description,Room,type,description,Bed,type,description
Main Building,building,Main hospital building,ICU,ward,Intensive Care Unit,Bed 1,bed,ICU Bed 1
Main Building,building,Main hospital building,ICU,ward,Intensive Care Unit,Bed 2,bed,ICU Bed 2
Main Building,building,Main hospital building,Reception,room,Main reception area,Waiting Area,area,Patient waiting space`;
                      const blob = new Blob([sampleCSV], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample_locations.csv";
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    Download Sample CSV
                  </Button>
                </div>
              </label>
            </div>

            {uploadError && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                Valid Location Types:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LocationFormLabels).map(([key, label]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {label} ({key})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Location Import Wizard</CardTitle>
          <CardDescription>
            Review and validate locations before importing
          </CardDescription>
          <div className="mt-4">
            <Progress value={100} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="text-lg font-semibold mb-4">Review All Locations</h3>
            <HierarchicalLocationPreview locations={processedLocations} />
          </div>
          <div className="flex justify-end">
            <Button
              className="mt-4"
              onClick={() => saveLocations(processedLocations)}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const HierarchicalLocationPreview = ({
  locations,
}: {
  locations: LocationImportT[];
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const toggleExpanded = (locationId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    setExpandedItems(newExpanded);
  };

  const renderLocationItem = (location: LocationImportT, depth: number = 0) => {
    const IconComponent = LocationTypeIcons[location.form];
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedItems.has(location.name);
    const locationId = `${location.name}-${depth}`;

    return (
      <div key={locationId} className="w-full">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleExpanded(location.name)}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Indentation for hierarchy levels */}
                <div
                  className="flex items-center"
                  style={{ marginLeft: `${depth * 24}px` }}
                >
                  {hasChildren && (
                    <div className="flex items-center justify-center w-4 h-4 mr-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                  )}
                  {!hasChildren && <div className="w-4 mr-2" />}
                </div>

                {/* Location Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Location Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {location.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {location.form}
                    </Badge>
                    <Badge
                      variant={
                        location.mode === "instance" ? "primary" : "secondary"
                      }
                      className="text-xs"
                    >
                      {location.mode}
                    </Badge>
                  </div>
                  {location.description && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {location.description}
                    </p>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-2 ml-4">
                  <Badge
                    variant={
                      location.status === "active" ? "primary" : "secondary"
                    }
                    className="text-xs"
                  >
                    {location.status}
                  </Badge>
                  {hasChildren && (
                    <Badge variant="outline" className="text-xs">
                      {location.children.length} child
                      {location.children.length !== 1 ? "ren" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          {hasChildren && (
            <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
              <div className="ml-6 border-l-2 border-gray-200">
                {location.children.map((child) =>
                  renderLocationItem(child, depth + 1),
                )}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No locations to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">Location Hierarchy Preview</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedItems(new Set())}
          >
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allNames = new Set<string>();
              const collectNames = (locs: LocationImportT[]) => {
                locs.forEach((loc) => {
                  allNames.add(loc.name);
                  if (loc.children.length > 0) {
                    collectNames(loc.children);
                  }
                });
              };
              collectNames(locations);
              setExpandedItems(allNames);
            }}
          >
            Expand All
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        {locations.map((location) => renderLocationItem(location))}
      </div>

      <div className="text-sm text-gray-500">
        <p>Total locations: {countTotalLocations(locations)}</p>
      </div>
    </div>
  );
};

// Helper function to count total locations including children
const countTotalLocations = (locations: LocationImportT[]): number => {
  let count = 0;
  const countRecursive = (locs: LocationImportT[]) => {
    locs.forEach((loc) => {
      count++;
      if (loc.children.length > 0) {
        countRecursive(loc.children);
      }
    });
  };
  countRecursive(locations);
  return count;
};

interface QueueItem {
  parentId?: string;
  nodes: LocationImportT[];
}

export function useSaveLocations(facilityId: string) {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const { mutate: submitBatch } = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: (data) => {
      const res = data as BatchRequestResponse<LocationDetail>;
      setQueue((prev) => {
        if (prev.length === 0) return prev;

        // dequeue the processed item
        const [completed, ...rest] = prev;

        // map results back to children
        const children: QueueItem[] = res.results.map((r, index) => ({
          parentId: r.data?.id,
          nodes: completed.nodes[index].children,
        }));

        return [...rest, ...children];
      });
    },
    onError: (error) => {
      console.error("Batch submission failed:", error);
    },
  });

  // Effect: process the next batch whenever the queue changes
  useEffect(() => {
    console.log("Processing queue:", queue);
    if (queue.length === 0) return;

    const { parentId, nodes: allNodes } = queue[0];

    if (allNodes.length > 20) {
      const overflow = allNodes.slice(20);
      const cleanNodes = allNodes.slice(0, 20);
      setQueue((prev) => [
        { parentId, nodes: cleanNodes },
        ...prev.slice(1),
        { parentId, nodes: overflow },
      ]);
      return;
    }

    const nodes = allNodes.slice(0, 20);
    const toSave: LocationWrite[] = nodes
      .filter((n) => !n.id)
      .map((n) => ({
        parent: parentId ?? undefined,
        organizations: [],
        status: n.status,
        operational_status: n.operational_status,
        name: n.name,
        description: n.description,
        location_type: n.location_type,
        form: n.form,
        mode: n.mode,
      }));

    console.log("Saving locations:", toSave);

    if (toSave.length === 0) {
      // dequeue empty and let effect run again
      setQueue((prev) => prev.slice(1));
      return;
    }

    const { path, method } = locationApi.create;
    const url = path.replace("{facility_id}", facilityId);

    const batchRequest: BatchRequestBody = {
      requests: toSave.map((location) => ({
        url,
        method,
        reference_id: location.name,
        body: location,
      })),
    };

    submitBatch(batchRequest);
  }, [queue, facilityId, submitBatch]);

  // Entry point: start the saving process
  const saveLocations = useCallback((roots: LocationImportT[]) => {
    console.log("Saving locations:", roots);
    setQueue([{ parentId: undefined, nodes: roots }]);
  }, []);

  return { saveLocations, queue };
}
