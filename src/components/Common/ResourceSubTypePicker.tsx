import { ChevronRight, Folder, FolderOpen, Home } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";

interface ResourceSubTypePickerProps {
  resourceType: ResourceCategoryResourceType;
  value?: ResourceCategorySubType;
  onValueChange?: (value: ResourceCategorySubType) => void;
  className?: string;
}

interface SubTypeNode {
  title: string;
  children?: SubTypeNode[];
  value?: ResourceCategorySubType;
}

type SubTree = Record<
  string,
  {
    title: string;
    isLeaf: boolean;
    children: SubTree;
  }
>;

const categorySubTypeArray = (root: SubTree, parent = ""): SubTypeNode[] => {
  return [
    ...Object.entries(root).map(([, { title, isLeaf, children }]) => {
      const key = parent ? [parent, title].join(":") : title;
      return {
        title: title,
        value: isLeaf ? (key as ResourceCategorySubType) : undefined,
        children: categorySubTypeArray(children, key),
      };
    }),
  ] satisfies SubTypeNode[];
};
const categorySubtypeObject = (subString: string, subTree: SubTree) => {
  const [rootElement, ...childElements] = subString.split(":");
  if (!rootElement) return;
  if (!(rootElement in subTree)) {
    subTree[rootElement] = {
      title: rootElement,
      isLeaf: !childElements.length,
      children: {},
    };
  }
  categorySubtypeObject(childElements.join(":"), subTree[rootElement].children);
};

function buildSubTypeTree(resourceType: ResourceCategoryResourceType) {
  const releventCategories = Object.values(ResourceCategorySubType)
    .filter(
      (sub) => sub.startsWith(`${resourceType}:`) || sub.startsWith("all:"),
    )
    .map((ele) => ele.replace(`${resourceType}:`, "").replace("all:", ""));
  const rootTree: SubTree = {};
  for (let i = 0; i < releventCategories.length; i++) {
    categorySubtypeObject(releventCategories[i], rootTree);
  }
  return categorySubTypeArray(rootTree);
}

export function ResourceSubTypePicker({
  resourceType,
  value,
  onValueChange,
  className,
}: ResourceSubTypePickerProps) {
  const { t } = useTranslation();
  const [breadcrumbs, setBreadcrumbs] = useState<SubTypeNode[]>([]);

  const getHierarchicalDisplay = (selectedValue?: ResourceCategorySubType) => {
    if (!selectedValue) return null;

    const cleanValue = selectedValue
      .replace(`${resourceType}:`, "")
      .replace("all:", "");

    const parts = cleanValue.split(":");
    return parts.map((part) => t(part)).join(" > ");
  };

  const tree = useMemo(() => buildSubTypeTree(resourceType), [resourceType]);
  const currentNodes = useMemo(() => {
    if (breadcrumbs.length === 0) return tree;
    return breadcrumbs[breadcrumbs.length - 1].children || [];
  }, [breadcrumbs, tree]);

  const resourceSubTypeMap = (value: string) => {
    if (value === "other") return ResourceCategorySubType.other;
    else {
      const key = resourceType + "_" + value.replace(":", "_");
      return ResourceCategorySubType[
        key as keyof typeof ResourceCategorySubType
      ];
    }
  };

  const handleNavigate = (node: SubTypeNode) => {
    if (node.children && node.children.length > 0) {
      setBreadcrumbs((prev) => [...prev, node]);
    }
  };

  const handleSelect = (value: string) => {
    const resourceSubType = resourceSubTypeMap(value);
    onValueChange?.(resourceSubType);
    setBreadcrumbs([]);
  };

  const handleBackToRoot = () => setBreadcrumbs([]);

  const getCurrentLevelTitle = () =>
    breadcrumbs.length === 0
      ? t("root")
      : breadcrumbs[breadcrumbs.length - 1]?.title || t("root");

  const displayValue = getHierarchicalDisplay(value);

  return (
    <div className={cn("w-full", className)}>
      <SelectTrigger className="w-full justify-between">
        <SelectValue placeholder={t("select_category")}>
          {displayValue || t("select_category")}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="p-0 min-w-[320px]">
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Home className="size-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 truncate">
              {t(getCurrentLevelTitle())}
            </span>
          </div>
        </div>

        {breadcrumbs.length > 0 && (
          <div className="px-4 py-2 border-b bg-gray-100">
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                className="h-6 px-2 rounded hover:bg-white text-gray-700"
                onClick={handleBackToRoot}
              >
                {t("root")}
              </button>
              {breadcrumbs.map((bc, idx) => (
                <div key={bc.value} className="flex items-center">
                  <ChevronRight className="size-3 mx-1 text-gray-500" />
                  <button
                    type="button"
                    className="h-6 px-2 rounded hover:bg-white text-gray-700"
                    onClick={() =>
                      setBreadcrumbs(breadcrumbs.slice(0, idx + 1))
                    }
                  >
                    {t(bc.title)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[40vh] overflow-auto">
          {/* Non-leaf nodes (navigation) */}
          {currentNodes
            ?.filter((n) => n.children && n.children.length > 0)
            .map((node) => (
              <div
                key={node.value}
                className={cn(
                  "flex items-center justify-between p-3 cursor-pointer",
                  "hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-200",
                )}
                onClick={() => handleNavigate(node)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FolderOpen className="size-4.5 text-gray-500" />
                  <div className="font-medium text-sm truncate">
                    {t(node.title)}
                  </div>
                </div>
                <ChevronRight className="size-4 text-gray-500" />
              </div>
            ))}

          {/* Leaf nodes (selectable) */}
          {currentNodes
            ?.filter((n) => !n.children || n.children.length === 0)
            .map((leaf) => (
              <SelectItem
                key={leaf.title}
                value={resourceSubTypeMap(leaf.value as string)}
                onSelect={() => {
                  handleSelect(leaf.value as string);
                }}
                className="p-3 border-b border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <Folder className="size-4.5 text-gray-500" />
                  {t(leaf.title)}
                </span>
              </SelectItem>
            ))}
        </div>
      </SelectContent>
    </div>
  );
}

export default ResourceSubTypePicker;
