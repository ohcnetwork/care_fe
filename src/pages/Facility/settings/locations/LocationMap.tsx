import { ChevronDown, ChevronRight, ChevronUp, Hospital } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Panel,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from "reactflow";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  LocationList as LocationListType,
  LocationTypeIcons,
} from "@/types/location/location";

// Constants
const LEVEL_HEIGHT = 220;
const NODE_WIDTH = 280;
const ROOT_SPACING = 50;

interface LocationMapProps {
  locations: LocationListType[];
  onLocationClick: (location: LocationListType) => void;
  facilityName: string;
  searchQuery?: string;
  isEditing?: boolean;
}

const CustomNode = ({ data }: NodeProps) => {
  const { t } = useTranslation();
  const { zoom } = useViewport();
  const hasChildren = data.childCount > 0;
  const Icon =
    data.form === "facility"
      ? Hospital
      : LocationTypeIcons[data.form as keyof typeof LocationTypeIcons];
  const showTooltip = zoom < 1 || data.name.length > 25;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggle(data.id);
  };

  return (
    <div className="relative">
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-slate-400"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="bg-slate-400"
        isConnectable={false}
      />
      {hasChildren && (
        <>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[93%] h-full border-2 border-gray-200 rounded-lg bg-white" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[97%] h-full border-2 border-gray-200 rounded-lg bg-white" />
        </>
      )}
      <div
        onClick={() => data.onClick({ id: data.id })}
        className={cn(
          "relative w-[240px] bg-white rounded-lg border-2 overflow-hidden shadow-sm cursor-pointer",
          "border-gray-200",
          "hover:border-primary/50 hover:shadow-lg",
          "transition-all duration-200",
        )}
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <h3 className="font-medium text-gray-900 truncate">
                      {data.name}
                    </h3>
                  </TooltipTrigger>
                  {showTooltip && (
                    <TooltipContent>
                      <p>{data.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm text-gray-500 truncate">{data.type}</p>
            </div>
          </div>
          {hasChildren && (
            <div
              className="flex justify-center mt-2 border-t pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-gray-100 transition-colors"
                onClick={handleToggle}
              >
                <span className="text-sm mr-2 text-gray-600">
                  {data.childCount} {t("level_inside")}
                </span>
                {data.form !== "facility" &&
                  (data.isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  ))}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Utility function to calculate node width
function calculateNodeWidth(
  location: LocationListType,
  locations: LocationListType[],
  expandedNodes: string[],
): number {
  if (!expandedNodes.includes(location.id)) return NODE_WIDTH;

  const children = locations.filter((loc) => loc.parent?.id === location.id);
  if (children.length === 0) return NODE_WIDTH;

  return Math.max(
    NODE_WIDTH,
    children.reduce(
      (sum, child) => sum + calculateNodeWidth(child, locations, expandedNodes),
      0,
    ) +
      (children.length - 1) * 40,
  );
}

// Create facility root node
function createFacilityRootNode(
  facilityName: string,
  rootLocationsCount: number,
  t: (key: string) => string,
): Node {
  return {
    id: "facility-root",
    type: "custom",
    position: { x: 0, y: 0 },
    draggable: true,
    data: {
      name: facilityName,
      type: t("facility"),
      form: "facility",
      childCount: rootLocationsCount,
      id: "facility-root",
      isExpanded: true,
      onToggle: () => {},
      onClick: () => {},
    },
  };
}

// Create a location node
function createLocationNode(
  location: LocationListType,
  childLocations: LocationListType[],
  isExpanded: boolean,
  level: number,
  offsetX: number,
  toggleNode: (id: string) => void,
  onLocationClick: (location: LocationListType) => void,
  t: (key: string) => string,
): Node {
  return {
    id: location.id,
    type: "custom",
    position: { x: offsetX, y: level * LEVEL_HEIGHT },
    data: {
      name: location.name,
      type: t(`location_form__${location.form}`),
      form: location.form,
      childCount: childLocations.length,
      id: location.id,
      isExpanded,
      onToggle: toggleNode,
      onClick: (_loc: LocationListType) => onLocationClick(location),
    },
  };
}

// Create an edge between nodes
function createEdge(sourceId: string, targetId: string): Edge {
  return {
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#94a3b8",
      strokeWidth: 1.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 12,
      height: 12,
      color: "#94a3b8",
    },
  };
}

// Process location and its children recursively
function processLocationHierarchy(
  location: LocationListType,
  locations: LocationListType[],
  expandedNodes: string[],
  level: number,
  offsetX: number,
  parentX: number | null,
  toggleNode: (id: string) => void,
  onLocationClick: (location: LocationListType) => void,
  t: (key: string) => string,
): { nodes: Node[]; edges: Edge[] } {
  const isExpanded = expandedNodes.includes(location.id);
  const childLocations = locations.filter(
    (loc) => loc.parent?.id === location.id,
  );
  const result = { nodes: [] as Node[], edges: [] as Edge[] };

  // Create current location node
  const node = createLocationNode(
    location,
    childLocations,
    isExpanded,
    level,
    offsetX,
    toggleNode,
    onLocationClick,
    t,
  );
  result.nodes.push(node);

  // Create edge from parent if exists
  if (parentX !== null && location.parent?.id) {
    result.edges.push(createEdge(location.parent.id, location.id));
  }

  // Process children if expanded
  if (isExpanded && childLocations.length > 0) {
    const totalChildrenWidth = childLocations.reduce(
      (sum, child) => sum + calculateNodeWidth(child, locations, expandedNodes),
      0,
    );
    const spacing = 20;
    const totalWidth =
      totalChildrenWidth + (childLocations.length - 1) * spacing;
    let currentOffset = offsetX - totalWidth / 2;

    childLocations.forEach((child) => {
      const childWidth = calculateNodeWidth(child, locations, expandedNodes);
      const childX = currentOffset + childWidth / 2;
      const childResult = processLocationHierarchy(
        child,
        locations,
        expandedNodes,
        level + 1,
        childX,
        offsetX,
        toggleNode,
        onLocationClick,
        t,
      );
      result.nodes.push(...childResult.nodes);
      result.edges.push(...childResult.edges);
      currentOffset += childWidth + spacing;
    });
  }

  return result;
}

function LocationMapContent({
  locations,
  onLocationClick,
  facilityName,
  searchQuery,
  isEditing,
}: LocationMapProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { fitView, setViewport, getViewport } = useReactFlow();
  const { t } = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [savedViewport, setSavedViewport] = useState<{
    x: number;
    y: number;
    zoom: number;
  } | null>(null);

  // Save viewport when opening edit
  useEffect(() => {
    if (isEditing) {
      const currentViewport = getViewport();
      setSavedViewport(currentViewport);
    }
  }, [isEditing, getViewport]);

  // Restore viewport when closing edit
  useEffect(() => {
    if (!isEditing && savedViewport && nodes.length > 0) {
      setViewport(savedViewport);
      setSavedViewport(null); // Clear saved viewport after restoring
    }
  }, [isEditing, savedViewport, setViewport, nodes]);

  // Get root locations
  const rootLocations = useMemo(
    () =>
      locations.filter(
        (loc) => !loc.parent || Object.keys(loc.parent).length === 0,
      ),
    [locations],
  );

  // Effect to handle search updates
  useEffect(() => {
    // Get all location IDs that match the search
    const matchedIds = new Set<string>();

    // Add all locations and their children to matched IDs
    const processLocation = (location: LocationListType) => {
      matchedIds.add(location.id);

      // Find and process all children
      const children = locations.filter(
        (loc) => loc.parent?.id === location.id,
      );
      children.forEach((child) => {
        processLocation(child);
      });
    };

    // Process all root locations first
    rootLocations.forEach((location) => {
      processLocation(location);
    });

    // For any remaining locations that might be children, ensure their parents are included
    locations.forEach((location) => {
      if (location.parent?.id) {
        let current = location;
        while (current.parent?.id) {
          matchedIds.add(current.parent.id);
          const parent = locations.find((loc) => loc.id === current.parent?.id);
          if (!parent) break;
          current = parent;
        }
      }
    });

    // Only update expanded nodes for search
    if (searchQuery && searchQuery.trim()) {
      setExpandedNodes((prev) => {
        const newExpanded = Array.from(matchedIds);
        return [...new Set([...prev, ...newExpanded])];
      });

      // Only fit view when there's an actual search
      setTimeout(() => {
        fitView({
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 0.7,
          duration: 800,
        });
      }, 100);
    }
  }, [locations, fitView, rootLocations, searchQuery]);

  useEffect(() => {
    if (searchQuery === "") {
      setExpandedNodes([]);
      // Fit view when collapsing all nodes
      setTimeout(() => {
        fitView({
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 0.7,
          duration: 800,
        });
      }, 100);
    }
  }, [searchQuery, fitView]);

  const toggleNode = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const isExpanding = !prev.includes(nodeId);
        const newExpandedNodes = isExpanding
          ? [...prev, nodeId]
          : prev.filter((id) => id !== nodeId);

        requestAnimationFrame(() => {
          if (isExpanding) {
            // Get all immediate children of the node
            const childNodes = locations
              .filter((loc) => loc.parent?.id === nodeId)
              .map((child) => ({ id: child.id }));

            // Include both parent and children in the view with adjusted padding
            fitView({
              padding: childNodes.length > 4 ? 0.5 : 0.3,
              minZoom: 0.2,
              maxZoom: 0.8,
              duration: 400,
              nodes: [{ id: nodeId }, ...childNodes],
            });
          } else {
            // When collapsing, focus directly on the clicked node
            fitView({
              padding: 0.2,
              minZoom: 0.2,
              maxZoom: 1,
              duration: 500,
              nodes: [{ id: nodeId }],
            });
          }
        });

        return newExpandedNodes;
      });
    },
    [fitView, locations],
  );

  const toggleAllNodes = useCallback(() => {
    setExpandedNodes((prev) => {
      const isExpanding = prev.length !== locations.length;
      const newExpandedNodes = isExpanding
        ? locations.map((loc) => loc.id)
        : [];

      setTimeout(() => {
        fitView({
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 0.8,
          duration: 800,
        });
      }, 100);

      return newExpandedNodes;
    });
  }, [locations, fitView]);

  // Generate nodes and edges
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Add facility root node
    const facilityNode = createFacilityRootNode(
      facilityName,
      rootLocations.length,
      t,
    );
    newNodes.push(facilityNode);

    // Process root locations
    if (rootLocations.length > 0) {
      const totalRootWidth = rootLocations.reduce(
        (sum, loc) => sum + calculateNodeWidth(loc, locations, expandedNodes),
        0,
      );
      const totalWidth =
        totalRootWidth + (rootLocations.length - 1) * ROOT_SPACING;
      let currentOffset = -totalWidth / 2;

      rootLocations.forEach((rootLocation) => {
        const locationWidth = calculateNodeWidth(
          rootLocation,
          locations,
          expandedNodes,
        );
        const locationX = currentOffset + locationWidth / 2;

        const { nodes: locationNodes, edges: locationEdges } =
          processLocationHierarchy(
            rootLocation,
            locations,
            expandedNodes,
            1,
            locationX,
            null,
            toggleNode,
            onLocationClick,
            t,
          );

        newNodes.push(...locationNodes);
        newEdges.push(...locationEdges);

        // Add edge from facility root
        newEdges.push(createEdge("facility-root", rootLocation.id));

        currentOffset += locationWidth + ROOT_SPACING;
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    locations,
    expandedNodes,
    toggleNode,
    onLocationClick,
    t,
    rootLocations,
    facilityName,
  ]);

  return (
    <div className="h-[600px] w-full bg-gray-50 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "#94a3b8",
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: "#94a3b8",
          },
        }}
        proOptions={{ hideAttribution: true }}
        fitView={!savedViewport && !isEditing}
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.2,
          maxZoom: 0.8,
          duration: 800,
        }}
        minZoom={0.1}
        maxZoom={2}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        panOnDrag={true}
        connectionMode={ConnectionMode.Loose}
      >
        <Background />
        <Controls showFitView={true} showZoom={true} showInteractive={false} />
        <Panel
          position="top-right"
          className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllNodes}
            className="flex items-center gap-2"
          >
            {expandedNodes.length === locations.length ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t("collapse_all")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t("expand_all")}
              </>
            )}
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function LocationMap(props: LocationMapProps) {
  return (
    <ReactFlowProvider>
      <LocationMapContent {...props} />
    </ReactFlowProvider>
  );
}
