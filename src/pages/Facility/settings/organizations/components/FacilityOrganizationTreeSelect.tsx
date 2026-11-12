import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  TreeSelect,
  type TreeSelectNode,
  type TreeSelectPagination,
} from "@/components/ui/tree-select";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

type FacilityOrganizationTreeSelectProps = {
  facilityId: string;
  favoriteList?: string;
  /** Organizations already known to the caller, so selected ones show names without a request. */
  knownOrganizations?: FacilityOrganizationRead[];
  /** Skips selecting the user's only department when nothing is selected. */
  optional?: boolean;
} & (
  | { mode?: "multi"; value: string[]; onChange: (value: string[]) => void }
  | {
      mode: "single";
      value: string | null;
      onChange: (value: string | null) => void;
    }
);

const PAGE_LIMIT = 20;

interface ChildrenPage {
  items: FacilityOrganizationRead[];
  count: number;
  loading: boolean;
}

interface MutableNode {
  id: string;
  name: string;
  hasChildren: boolean;
  children: Map<string, MutableNode>;
}

// The API ends the parent chain with an empty object instead of omitting it.
function getAncestors(organization: FacilityOrganizationRead) {
  const ancestors = [];
  for (let parent = organization.parent; parent?.id; parent = parent.parent) {
    ancestors.unshift(parent);
  }
  return ancestors;
}

// Each record is placed under its ancestors, which the API nests in `parent`,
// so a deep organization appears with its path before its siblings are loaded.
function buildTree(organizations: FacilityOrganizationRead[]) {
  const roots = new Map<string, MutableNode>();
  const place = (
    siblings: Map<string, MutableNode>,
    id: string,
    name: string,
  ) => {
    let node = siblings.get(id);
    if (!node) {
      node = { id, name, hasChildren: false, children: new Map() };
      siblings.set(id, node);
    }
    return node;
  };
  for (const organization of organizations) {
    let siblings = roots;
    for (const ancestor of getAncestors(organization)) {
      const node = place(siblings, ancestor.id, ancestor.name);
      node.hasChildren = true;
      siblings = node.children;
    }
    const node = place(siblings, organization.id, organization.name);
    node.hasChildren ||= organization.has_children;
  }
  const toNodes = (nodes: Map<string, MutableNode>): TreeSelectNode[] =>
    Array.from(nodes.values(), (node) => ({
      id: node.id,
      name: node.name,
      hasChildren: node.hasChildren,
      children: toNodes(node.children),
    }));
  return toNodes(roots);
}

// Top-level organizations, or name matches at any depth while searching.
function useRootOrganizations(facilityId: string, search: string) {
  return useInfiniteQuery({
    queryKey: ["facilityOrganization", facilityId, "tree", search],
    queryFn: ({ pageParam, signal }) => {
      const options = {
        pathParams: { facilityId },
        queryParams: {
          ...(search ? { name: search } : { parent: "" }),
          limit: String(PAGE_LIMIT),
          offset: String(pageParam),
        },
      };
      return (
        search
          ? query.debounced(facilityOrganizationApi.list, options)
          : query(facilityOrganizationApi.list, options)
      )({ signal });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const offset = allPages.length * PAGE_LIMIT;
      return offset < lastPage.count ? offset : null;
    },
    select: (data) => ({
      results: data.pages.flatMap((page) => page.results),
      count: data.pages[0]?.count ?? 0,
    }),
    placeholderData: keepPreviousData,
  });
}

// Children are fetched a page at a time, per parent, as branches are expanded.
function useChildPages(facilityId: string) {
  const queryClient = useQueryClient();
  const inFlight = useRef(new Set<string>());
  const [pages, setPages] = useState<Record<string, ChildrenPage>>({});

  const update = (
    parentId: string,
    change: (page: ChildrenPage) => Partial<ChildrenPage>,
  ) =>
    setPages((previous) => {
      const page = previous[parentId] ?? {
        items: [],
        count: 0,
        loading: false,
      };
      return { ...previous, [parentId]: { ...page, ...change(page) } };
    });

  const load = async (parentId: string) => {
    if (inFlight.current.has(parentId)) return;
    const current = pages[parentId];
    if (current && current.items.length >= current.count) return;
    inFlight.current.add(parentId);
    update(parentId, () => ({ loading: true }));
    const offset = current?.items.length ?? 0;
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["facilityOrganization", facilityId, parentId, offset],
        queryFn: query(facilityOrganizationApi.list, {
          pathParams: { facilityId },
          queryParams: {
            parent: parentId,
            limit: String(PAGE_LIMIT),
            offset: String(offset),
          },
        }),
      });
      update(parentId, (page) => ({
        items: [...page.items, ...result.results],
        count: result.count,
        loading: false,
      }));
    } catch {
      // Stop paging this level so a failing request is not retried endlessly.
      update(parentId, (page) => ({
        count: page.items.length,
        loading: false,
      }));
    } finally {
      inFlight.current.delete(parentId);
    }
  };

  return { pages, load };
}

interface FavoriteChange {
  organizationId: string;
  preferred: boolean;
}

function useFavoriteOrganizations(facilityId: string, favoriteList?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = ["facilityOrganization-favorites", facilityId, favoriteList];

  const { data } = useQuery({
    queryKey,
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: { favorite_list: favoriteList },
    }),
    enabled: !!favoriteList,
  });

  const { mutate: setFavorite } = useMutation({
    mutationFn: ({ organizationId, preferred }: FavoriteChange) =>
      mutate(
        preferred
          ? facilityOrganizationApi.addFavorite
          : facilityOrganizationApi.removeFavorite,
        { pathParams: { facilityId, organizationId } },
      )({ favorite_list: favoriteList }),
    onSuccess: (_, { preferred }) => {
      toast.success(
        t(preferred ? "marked_as_preferred" : "removed_from_preferred"),
      );
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const preferredIds = data?.results.map(({ id }) => id) ?? [];

  // Saves only the difference from the stored favourites.
  const changePreferredIds = (ids: string[]) => {
    for (const organizationId of ids) {
      if (!preferredIds.includes(organizationId))
        setFavorite({ organizationId, preferred: true });
    }
    for (const organizationId of preferredIds) {
      if (!ids.includes(organizationId))
        setFavorite({ organizationId, preferred: false });
    }
  };

  return {
    organizations: data?.results ?? [],
    // Without a favourite list there is nothing to wait for.
    loaded: !favoriteList || !!data,
    preferredIds,
    changePreferredIds,
  };
}

export default function FacilityOrganizationTreeSelect(
  props: FacilityOrganizationTreeSelectProps,
) {
  const { facilityId, favoriteList, knownOrganizations, optional } = props;
  const selection = props.value;
  const value = Array.isArray(selection)
    ? selection
    : selection
      ? [selection]
      : [];
  const { t } = useTranslation();
  const defaultsApplied = useRef(false);
  const [search, setSearch] = useState("");
  const root = useRootOrganizations(facilityId, search);
  const children = useChildPages(facilityId);
  const favorites = useFavoriteOrganizations(facilityId, favoriteList);

  const { data: mine } = useQuery({
    queryKey: ["facilityOrganization", facilityId, "mine"],
    queryFn: query(facilityOrganizationApi.listMine, {
      pathParams: { facilityId },
    }),
  });

  const records = [
    ...(root.data?.results ?? []),
    ...Object.values(children.pages).flatMap((page) => page.items),
    ...(mine?.results ?? []),
    ...favorites.organizations,
    ...(knownOrganizations ?? []),
  ];

  // A selected organization that was never listed still needs its name and path.
  const known = new Set<string>();
  for (const organization of records) {
    known.add(organization.id);
    for (const ancestor of getAncestors(organization)) {
      known.add(ancestor.id);
    }
  }
  const missingIds = value.filter((id) => !known.has(id));
  const fetchedOrganizations = useQueries({
    queries: missingIds.map((organizationId) => ({
      queryKey: ["facilityOrganization", facilityId, "detail", organizationId],
      queryFn: query(facilityOrganizationApi.get, {
        pathParams: { facilityId, organizationId },
      }),
    })),
    combine: (results) =>
      results.flatMap((result) => (result.data ? [result.data] : [])),
  });

  const tree = buildTree([...records, ...fetchedOrganizations]);
  // Undefined until loaded, so the "my departments" group is not shown empty.
  const assignedIds = mine?.results.map(({ id }) => id);
  const { preferredIds } = favorites;

  const pagination: TreeSelectPagination = {
    hasMore: (parentId) => {
      if (parentId === null) return !!root.hasNextPage;
      if (search) return false;
      const page = children.pages[parentId];
      return !page || page.items.length < page.count;
    },
    isLoading: (parentId) =>
      parentId === null
        ? root.isFetching || root.isFetchingNextPage
        : !!children.pages[parentId]?.loading,
    loadMore: (parentId) => {
      if (parentId !== null) void children.load(parentId);
      else if (root.hasNextPage && !root.isFetchingNextPage)
        void root.fetchNextPage();
    },
  };

  // Preselect the user's preferred departments, else their only department.
  let defaultIds: string[] = [];
  if (value.length === 0 && mine && favorites.loaded) {
    if (preferredIds.length > 0) defaultIds = preferredIds;
    else if (!optional && assignedIds?.length === 1) defaultIds = assignedIds;
  }
  const applyDefaults = useEffectEvent((ids: string[]) => {
    // A ref also guards StrictMode's repeated setup, and keeps a cleared
    // selection from being refilled.
    if (defaultsApplied.current) return;
    defaultsApplied.current = true;
    if (props.mode === "single") props.onChange(ids[0] ?? null);
    else props.onChange(ids);
  });
  // Runs every render; the ref in applyDefaults makes it a one-time call.
  useEffect(() => {
    if (defaultIds.length > 0) applyDefaults(defaultIds);
  });

  const common = {
    tree,
    itemLabel: {
      singular: t("department").toLowerCase(),
      plural: t("departments").toLowerCase(),
    },
    placeholder: t("select_department"),
    assignedIds,
    preferredIds,
    onPreferredIdsChange: favoriteList
      ? favorites.changePreferredIds
      : undefined,
    onQueryChange: setSearch,
    matchCount: search ? root.data?.count : undefined,
    pagination,
  };

  return props.mode === "single" ? (
    <TreeSelect
      {...common}
      mode="single"
      value={props.value}
      onChange={props.onChange}
    />
  ) : (
    <TreeSelect
      {...common}
      mode="multi"
      value={props.value}
      onChange={props.onChange}
    />
  );
}
