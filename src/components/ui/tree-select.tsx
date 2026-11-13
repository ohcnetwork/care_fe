"use client";

import {
  ArrowRight,
  Building,
  ChevronDown,
  Search,
  Star,
  X,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";

export interface TreeSelectNode {
  id: string;
  name: string;
  children?: readonly TreeSelectNode[];
  /** Marks a node as expandable while its children are still being loaded. */
  hasChildren?: boolean;
}

type TreeSelectPresentation = "auto" | "popover" | "drawer";

interface TreeSelectItemLabel {
  /** Lowercase noun for one option, e.g. "department". */
  singular: string;
  /** Lowercase noun for several options, e.g. "departments". */
  plural: string;
}

export interface TreeSelectPagination {
  /** parentId is null for the top level. */
  hasMore: (parentId: string | null) => boolean;
  isLoading: (parentId: string | null) => boolean;
  loadMore: (parentId: string | null) => void;
}

interface TreeSelectBaseProps {
  tree: readonly TreeSelectNode[];
  /** Called as the search text changes, to load matching options from a server. */
  onQueryChange?: (query: string) => void;
  /** Total matches for the current search when options are searched on a server. */
  matchCount?: number;
  /** Loads more options when the end of a level scrolls into view. */
  pagination?: TreeSelectPagination;
  /** Nouns used to build the field, panel, and status copy. */
  itemLabel?: TreeSelectItemLabel;
  /** Trigger text. Defaults to "Select {Item}". */
  placeholder?: string;
  /** Shortcuts listed in a "My {items}" group. The group is hidden when omitted. */
  assignedIds?: readonly string[];
  linkedIds?: readonly string[];
  /** Options to preselect next time. Single mode keeps at most one. */
  preferredIds?: readonly string[];
  /** Shows a "Select by default" switch on each selected card. */
  onPreferredIdsChange?: (ids: string[]) => void;
  /** Where the options open. "auto" uses a Popover from 640px and a Drawer below. */
  presentation?: TreeSelectPresentation;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
}

type TreeSelectProps = TreeSelectBaseProps &
  (
    | {
        mode: "single";
        value: string | null;
        onChange: (value: string | null) => void;
      }
    | { mode: "multi"; value: string[]; onChange: (value: string[]) => void }
  );

interface TreeEntry {
  node: TreeSelectNode;
  ancestors: TreeSelectNode[];
}

interface TreeRow {
  entry: TreeEntry;
  key: string;
  parentKey: string | null;
  expandable: boolean;
  children: TreeRow[];
}

function indexNodes(
  tree: readonly TreeSelectNode[],
  ancestors: TreeSelectNode[] = [],
): TreeEntry[] {
  return tree.flatMap((node) => [
    { node, ancestors },
    ...indexNodes(node.children ?? [], [...ancestors, node]),
  ]);
}

function pathText(entry: TreeEntry) {
  return [...entry.ancestors, entry.node].map((node) => node.name).join(" / ");
}

function NodePath({ entry }: { entry: TreeEntry }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-start wrap-anywhere">
      {entry.ancestors.map((node) => (
        <React.Fragment key={node.id}>
          <span className="text-soft-foreground font-normal">{node.name}</span>
          <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
        </React.Fragment>
      ))}
      <span className="font-semibold">{entry.node.name}</span>
    </span>
  );
}

function MatchedName({ name, query }: { name: string; query: string }) {
  const start = name.toLocaleLowerCase().indexOf(query);
  if (!query || start < 0) return name;
  return (
    <>
      {name.slice(0, start)}
      <mark className="rounded-xs bg-amber-100 font-semibold text-amber-950">
        {name.slice(start, start + query.length)}
      </mark>
      {name.slice(start + query.length)}
    </>
  );
}

const defaultItemLabel: TreeSelectItemLabel = {
  singular: "item",
  plural: "items",
};

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function LoadMoreSentinel({
  loading,
  empty,
  onVisible,
}: {
  loading: boolean;
  /** The level has no rows yet, so the first page is still on its way. */
  empty: boolean;
  onVisible: () => void;
}) {
  const { ref, inView } = useInView();
  const loadMore = React.useEffectEvent(onVisible);
  React.useEffect(() => {
    if (inView && !loading) loadMore();
  }, [inView, loading]);
  return (
    <li
      ref={ref}
      role="presentation"
      className="flex h-8 items-center justify-center"
    >
      {(loading || empty) && <Spinner />}
    </li>
  );
}

function TreeSelect(props: TreeSelectProps) {
  const {
    tree,
    onQueryChange,
    matchCount,
    pagination,
    itemLabel = defaultItemLabel,
    placeholder,
    assignedIds,
    linkedIds = [],
    preferredIds = [],
    onPreferredIdsChange,
    presentation = "auto",
    id,
    name,
    disabled = false,
    required = false,
    description,
    error,
    className,
  } = props;
  const { t } = useTranslation();
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const panelId = `${fieldId}-panel`;
  const { singular, plural } = itemLabel;
  const triggerText =
    placeholder ?? t("schema_select_placeholder", { label: singular });
  const wide = useBreakpoints({ default: false, sm: true });
  const inPopover =
    presentation === "popover" || (presentation === "auto" && wide);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [searchCollapsed, setSearchCollapsed] = React.useState<Set<string>>(
    new Set(),
  );
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [invalid, setInvalid] = React.useState(false);
  // Freezes the selected cards while the panel is open so the trigger above
  // which they render doesn't shift; cleared once the close animation ends.
  const [cardSnapshot, setCardSnapshot] = React.useState<string[] | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>());
  const entries = indexNodes(tree);
  const byId = new Map(entries.map((entry) => [entry.node.id, entry]));
  const selectedIds =
    props.mode === "multi"
      ? props.value
      : props.value === null
        ? []
        : [props.value];
  const selectedSet = new Set(selectedIds);
  const linkedSet = new Set(linkedIds);
  const preferredSet = new Set(preferredIds);
  const toEntry = (selectedId: string): TreeEntry =>
    byId.get(selectedId) ?? {
      node: { id: selectedId, name: selectedId },
      ancestors: [],
    };
  const selectedEntries = selectedIds.map(toEntry);
  const cardEntries = (cardSnapshot ?? selectedIds).map(toEntry);
  const term = query.trim().toLocaleLowerCase();
  const searching = term.length > 0;
  const matches = entries.filter((entry) =>
    entry.node.name.toLocaleLowerCase().includes(term),
  );
  const included = new Set(
    matches.flatMap((entry) => [
      ...entry.ancestors.map((node) => node.id),
      entry.node.id,
    ]),
  );
  const validationError =
    error ||
    (invalid && selectedIds.length === 0 ? t("field_required") : undefined);
  const describedBy =
    [
      description ? `${fieldId}-description` : null,
      validationError ? `${fieldId}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const buildRows = (
    nodes: readonly TreeSelectNode[],
    prefix: string,
    parentKey: string | null = null,
  ): TreeRow[] =>
    nodes.flatMap((node) => {
      if (searching && !included.has(node.id)) return [];
      const key = `${prefix}:${node.id}`;
      const entry = byId.get(node.id);
      if (!entry) return [];
      const children = buildRows(node.children ?? [], prefix, key);
      return [
        {
          entry,
          key,
          parentKey,
          expandable: children.length > 0 || (!searching && !!node.hasChildren),
          children,
        },
      ];
    });
  const assignedRows =
    searching || !assignedIds
      ? []
      : Array.from(new Set(assignedIds)).flatMap((nodeId) => {
          const entry = byId.get(nodeId);
          return entry
            ? [
                {
                  entry,
                  key: `assigned:${nodeId}`,
                  parentKey: null,
                  expandable: false,
                  children: [],
                },
              ]
            : [];
        });
  const allRows = buildRows(tree, "all");
  const isExpanded = (row: TreeRow) =>
    searching ? !searchCollapsed.has(row.key) : expanded.has(row.key);
  const flattenRows = (rows: TreeRow[]): TreeRow[] =>
    rows.flatMap((row) => [
      row,
      ...(isExpanded(row) ? flattenRows(row.children) : []),
    ]);
  const visibleRows = [...flattenRows(assignedRows), ...flattenRows(allRows)];
  const activeRow = visibleRows.find((row) => row.key === activeKey);

  React.useEffect(() => {
    if (activeKey)
      rowRefs.current.get(activeKey)?.scrollIntoView({ block: "nearest" });
  }, [activeKey]);

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setQuery("");
      onQueryChange?.("");
      setActiveKey(null);
      setSearchCollapsed(new Set());
      setExpanded(new Set());
      setCardSnapshot(selectedIds);
    }
    setOpen(nextOpen);
  };

  const completeOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setCardSnapshot(null);
  };

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    onQueryChange?.(nextQuery);
    setActiveKey(null);
    setSearchCollapsed(new Set());
  };

  const selectNode = (nodeId: string) => {
    if (disabled || linkedSet.has(nodeId)) return;
    if (props.mode === "single") {
      props.onChange(nodeId);
      setOpen(false);
    } else {
      if (required && selectedSet.has(nodeId) && selectedIds.length === 1)
        return;
      props.onChange(
        selectedSet.has(nodeId)
          ? props.value.filter((selectedId) => selectedId !== nodeId)
          : [...props.value, nodeId],
      );
    }
    setInvalid(false);
  };

  const removeNode = (nodeId: string) => {
    if (props.mode === "single") props.onChange(null);
    else
      props.onChange(props.value.filter((selectedId) => selectedId !== nodeId));
    triggerRef.current?.focus();
  };

  const setPreferred = (nodeId: string, preferred: boolean) => {
    if (!onPreferredIdsChange) return;
    if (!preferred)
      onPreferredIdsChange(
        preferredIds.filter((preferredId) => preferredId !== nodeId),
      );
    else if (props.mode === "single") onPreferredIdsChange([nodeId]);
    else if (!preferredSet.has(nodeId))
      onPreferredIdsChange([...preferredIds, nodeId]);
  };

  const toggleExpansion = (row: TreeRow) => {
    const update = (current: Set<string>) => {
      const next = new Set(current);
      if (next.has(row.key)) next.delete(row.key);
      else next.add(row.key);
      return next;
    };
    if (searching) setSearchCollapsed(update);
    else setExpanded(update);
    if (
      !searching &&
      !isExpanded(row) &&
      pagination?.hasMore(row.entry.node.id)
    )
      pagination.loadMore(row.entry.node.id);
  };

  const navigate = (event: React.KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = visibleRows.findIndex((row) => row.key === activeKey);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        index < 0
          ? event.key === "ArrowDown"
            ? 0
            : visibleRows.length - 1
          : Math.max(
              0,
              Math.min(
                visibleRows.length - 1,
                index + (event.key === "ArrowDown" ? 1 : -1),
              ),
            );
      setActiveKey(visibleRows[nextIndex]?.key ?? null);
    } else if (activeRow && event.key === "ArrowRight") {
      event.preventDefault();
      if (activeRow.expandable && !isExpanded(activeRow))
        toggleExpansion(activeRow);
      else if (activeRow.children[0]) setActiveKey(activeRow.children[0].key);
    } else if (activeRow && event.key === "ArrowLeft") {
      event.preventDefault();
      if (activeRow.expandable && isExpanded(activeRow))
        toggleExpansion(activeRow);
      else if (activeRow.parentKey) setActiveKey(activeRow.parentKey);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeRow) selectNode(activeRow.entry.node.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  const preserveSearchFocus = (event: React.PointerEvent) => {
    if (document.activeElement === searchRef.current) event.preventDefault();
  };

  const renderRows = (
    rows: TreeRow[],
    depth = 1,
    parentId: string | null = null,
    paginated = true,
  ): React.ReactNode => (
    <ul role="group" className="min-w-0">
      {rows.map((row) => {
        const { node, ancestors } = row.entry;
        const selected = selectedSet.has(node.id);
        const linked = linkedSet.has(node.id);
        const expandedRow = row.expandable && isExpanded(row);
        const loadingChildren =
          !searching && paginated && !!pagination?.isLoading(node.id);
        const showChildren =
          expandedRow && !(loadingChildren && row.children.length === 0);
        const descendantSelections = selectedEntries.filter((entry) =>
          entry.ancestors.some((ancestor) => ancestor.id === node.id),
        ).length;
        const controlId = `${panelId}-${row.key}-control`;
        const contextOnly =
          searching && !node.name.toLocaleLowerCase().includes(term);
        return (
          <li
            key={row.key}
            id={`${panelId}-${row.key}`}
            role="treeitem"
            aria-level={depth}
            aria-expanded={row.expandable ? expandedRow : undefined}
            aria-selected={props.mode === "single" ? selected : undefined}
            aria-checked={props.mode === "multi" ? selected : undefined}
            aria-disabled={linked || undefined}
            aria-label={node.name}
          >
            <div
              ref={(element) => {
                if (element) rowRefs.current.set(row.key, element);
                else rowRefs.current.delete(row.key);
              }}
              data-slot="tree-select-row"
              data-node-id={node.id}
              data-active={activeKey === row.key || undefined}
              className={cn(
                "hover:bg-muted flex min-h-12 min-w-0 items-center gap-2 rounded-md px-2 text-sm sm:min-h-11",
                props.mode === "single" && selected && "bg-muted-background",
                activeKey === row.key && "bg-muted",
              )}
            >
              <label
                htmlFor={controlId}
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 items-center gap-2 py-2 sm:min-h-11",
                  linked
                    ? "text-soft-foreground cursor-not-allowed"
                    : "cursor-pointer",
                )}
                onPointerDown={preserveSearchFocus}
                onClick={(event) => {
                  if (
                    document.activeElement === searchRef.current &&
                    !(
                      event.target instanceof Element &&
                      event.target.closest(
                        '[data-slot="checkbox"],[data-slot="radio-group-item"]',
                      )
                    )
                  ) {
                    event.preventDefault();
                    selectNode(node.id);
                  }
                }}
              >
                {props.mode === "multi" ? (
                  <Checkbox
                    id={controlId}
                    checked={selected}
                    disabled={linked || disabled}
                    aria-label={node.name}
                    onPointerDown={preserveSearchFocus}
                    onCheckedChange={() => selectNode(node.id)}
                    onFocus={() => setActiveKey(row.key)}
                  />
                ) : (
                  <RadioGroupItem
                    id={controlId}
                    value={node.id}
                    disabled={linked || disabled}
                    aria-label={node.name}
                    onClick={() => {
                      if (selected) setOpen(false);
                    }}
                    onFocus={() => setActiveKey(row.key)}
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 wrap-anywhere">
                  <span
                    className={cn(
                      (contextOnly || linked) && "text-soft-foreground",
                    )}
                  >
                    <MatchedName name={node.name} query={term} />
                  </span>
                  {row.key.startsWith("assigned:") && ancestors.length > 0 && (
                    <span className="text-soft-foreground text-xs">
                      {ancestors.map((ancestor) => ancestor.name).join(" / ")}
                    </span>
                  )}
                </span>
              </label>
              {preferredSet.has(node.id) && (
                <Badge
                  variant="primary"
                  size="sm"
                  className="h-auto max-w-22 shrink-0 py-0.5 whitespace-normal"
                >
                  {t("preferred")}
                </Badge>
              )}
              {linked && (
                <Badge
                  variant="amber"
                  size="sm"
                  className="h-auto max-w-22 shrink-0 py-0.5 whitespace-normal"
                >
                  {t("linked")}
                </Badge>
              )}
              {row.expandable && !expandedRow && descendantSelections > 0 && (
                <Badge
                  variant="blue"
                  size="sm"
                  className="h-auto max-w-22 shrink-0 py-0.5 whitespace-normal"
                >
                  {t("selected_count", {
                    count: descendantSelections,
                  })}
                </Badge>
              )}
              {row.expandable && (
                <Button
                  type="button"
                  variant="tertiary"
                  size="icon"
                  className="size-10 shrink-0"
                  aria-expanded={expandedRow}
                  aria-busy={loadingChildren || undefined}
                  aria-controls={`${panelId}-${row.key}-children`}
                  aria-label={`${t(expandedRow ? "collapse" : "expand")} ${node.name}`}
                  onPointerDown={preserveSearchFocus}
                  onClick={() => toggleExpansion(row)}
                >
                  {loadingChildren ? (
                    <Spinner />
                  ) : (
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "transition-transform motion-reduce:transition-none",
                        expandedRow && "rotate-180",
                      )}
                    />
                  )}
                </Button>
              )}
            </div>
            {showChildren && (
              <div
                id={`${panelId}-${row.key}-children`}
                className="ms-5 min-w-0 sm:ms-6"
              >
                {renderRows(row.children, depth + 1, node.id)}
              </div>
            )}
          </li>
        );
      })}
      {paginated && pagination?.hasMore(parentId) && (
        <LoadMoreSentinel
          loading={pagination.isLoading(parentId)}
          empty={rows.length === 0}
          onVisible={() => pagination.loadMore(parentId)}
        />
      )}
    </ul>
  );

  const groups = (
    <div
      role="tree"
      id={`${panelId}-tree`}
      aria-label={capitalize(plural)}
      aria-multiselectable={props.mode === "multi" || undefined}
    >
      {!searching && assignedIds && (
        <>
          <div role="group" aria-labelledby={`${panelId}-assigned`}>
            <h3
              id={`${panelId}-assigned`}
              className="text-soft-foreground px-2 py-2 text-xs font-medium"
            >
              {t("my_items", { noun: plural })}
            </h3>
            {assignedRows.length > 0 ? (
              renderRows(assignedRows, 1, null, false)
            ) : (
              <p className="text-soft-foreground px-2 py-3 text-sm">
                {t("no_results_found")}
              </p>
            )}
          </div>
          <Separator className="my-2" />
        </>
      )}
      <div role="group" aria-labelledby={`${panelId}-all`}>
        <div className="flex min-h-9 items-center px-2">
          <h3
            id={`${panelId}-all`}
            className="text-soft-foreground text-xs font-medium"
          >
            {searching
              ? t("match_count", {
                  count: matchCount ?? matches.length,
                })
              : t("all_items", { noun: plural })}
          </h3>
        </div>
        {allRows.length > 0 ? (
          renderRows(allRows)
        ) : pagination?.isLoading(null) ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          !searching && (
            <p className="text-soft-foreground px-2 py-8 text-center text-sm">
              {t("no_results_found")}
            </p>
          )
        )}
      </div>
    </div>
  );

  const panelBody = (
    <>
      <div className="shrink-0 p-2 pb-1">
        <InputGroup className="h-12 sm:h-11">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={(event) => {
              if (!event.nativeEvent.isComposing) navigate(event);
            }}
            placeholder={t("schema_search_placeholder", { label: plural })}
            aria-label={t("schema_search_placeholder", { label: plural })}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="tree"
            aria-controls={`${panelId}-tree`}
            aria-activedescendant={
              activeRow ? `${panelId}-${activeRow.key}` : undefined
            }
            className="placeholder:text-placeholder-foreground text-base sm:text-sm"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-11"
                aria-label={t("clear_search")}
                onClick={() => {
                  changeQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
      <div
        data-slot="tree-select-list"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2",
          inPopover && "max-h-92.5",
        )}
      >
        {props.mode === "single" ? (
          <RadioGroup
            value={props.value ?? ""}
            onValueChange={selectNode}
            className="gap-0"
          >
            {groups}
          </RadioGroup>
        ) : (
          groups
        )}
      </div>
    </>
  );

  const clearAll = () => {
    if (props.mode !== "multi" || required) return;
    props.onChange([]);
    // The footer actions unmount once nothing is selected; keep focus in the panel.
    (inPopover ? searchRef : closeRef).current?.focus();
  };
  const clearSelection = () => {
    if (props.mode !== "single" || required) return;
    props.onChange(null);
    setOpen(false);
  };
  const clearSelectionButton =
    props.mode === "single" && props.value !== null ? (
      <Button
        type="button"
        variant="ghost"
        disabled={required}
        onClick={clearSelection}
      >
        {t("clear_selection")}
      </Button>
    ) : null;
  const footer = inPopover ? (
    <div className="border-border flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-t p-2 ps-3">
      {props.mode === "multi" ? (
        <>
          <span className="text-soft-foreground me-auto text-xs" role="status">
            {selectedIds.length > 0 &&
              t("selected_count", { count: selectedIds.length })}
          </span>
          {selectedIds.length > 0 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={required}
                onClick={clearAll}
              >
                {t("clear_all")}
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                {t("done")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("close")}
            </Button>
          )}
        </>
      ) : (
        <>
          {clearSelectionButton}
          <Button
            type="button"
            variant="ghost"
            className="ms-auto"
            onClick={() => setOpen(false)}
          >
            {t("close")}
          </Button>
        </>
      )}
    </div>
  ) : props.mode === "multi" ? (
    selectedIds.length > 0 ? (
      <DrawerFooter className="flex-row justify-between gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="ghost"
          disabled={required}
          onClick={clearAll}
        >
          {t("clear_all")}
        </Button>
        <Button
          type="button"
          className="min-w-0"
          onClick={() => setOpen(false)}
        >
          {`${t("done")} (${selectedIds.length})`}
        </Button>
      </DrawerFooter>
    ) : null
  ) : clearSelectionButton ? (
    <DrawerFooter className="flex-row gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {clearSelectionButton}
    </DrawerFooter>
  ) : null;

  const trigger = (
    <Button
      ref={triggerRef}
      id={fieldId}
      type="button"
      variant="outline"
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={!!validationError || undefined}
      className="border-input h-auto min-h-11 w-full min-w-0 justify-between gap-2 py-2 text-start font-normal shadow-none md:h-auto md:min-h-10"
    >
      <span className="text-placeholder-foreground min-w-0 flex-1 truncate">
        {triggerText}
      </span>
      <ChevronDown aria-hidden="true" data-icon="inline-end" />
    </Button>
  );
  const selectedHeading = t("selected");
  const panelTitle = t("schema_select_placeholder", {
    label: props.mode === "multi" ? plural : singular,
  });

  return (
    <Field
      data-slot="tree-select"
      data-mode={props.mode}
      data-presentation={inPopover ? "popover" : "drawer"}
      data-invalid={!!validationError || undefined}
      className={cn("min-w-0 font-sans text-sm", className)}
    >
      <FieldLabel htmlFor={fieldId} className="sr-only">
        {t("schema_select_placeholder", { label: singular })}
      </FieldLabel>
      <div className="flex w-full min-w-0 items-center gap-1">
        {inPopover ? (
          <Popover
            open={open}
            onOpenChange={changeOpen}
            onOpenChangeComplete={completeOpenChange}
          >
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent
              initialFocus={searchRef}
              align="start"
              sideOffset={4}
              className="flex max-h-(--available-height) w-[max(var(--anchor-width),20rem)] max-w-(--available-width) min-w-0 flex-col gap-0 overflow-hidden rounded-[10px] p-0 text-sm motion-reduce:animate-none"
            >
              <PopoverTitle className="sr-only">{panelTitle}</PopoverTitle>
              {panelBody}
              {footer}
            </PopoverContent>
          </Popover>
        ) : (
          <Drawer
            open={open}
            onOpenChange={changeOpen}
            onOpenChangeComplete={completeOpenChange}
            showSwipeHandle
          >
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent initialFocus={closeRef} height="fixed">
              <DrawerHeader showCloseButton>
                <DrawerTitle>{panelTitle}</DrawerTitle>
              </DrawerHeader>
              {panelBody}
              {footer}
            </DrawerContent>
          </Drawer>
        )}
      </div>
      {cardEntries.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <ul aria-label={selectedHeading} className="flex flex-col gap-2">
            {cardEntries.map((entry) => {
              const nodeId = entry.node.id;
              const preferred = preferredSet.has(nodeId);
              return (
                <li
                  key={nodeId}
                  data-slot="tree-select-card"
                  className="border-border bg-muted/40 flex items-center gap-3 rounded-md border p-2.5"
                >
                  <Building
                    aria-hidden="true"
                    className="text-muted-foreground size-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <NodePath entry={entry} />
                  </span>
                  {onPreferredIdsChange && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "size-8 shrink-0 p-0",
                        preferred
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-400 hover:text-yellow-500",
                      )}
                      disabled={disabled}
                      onClick={() => setPreferred(nodeId, !preferred)}
                    >
                      <Star
                        aria-hidden="true"
                        className={cn("size-4", preferred && "fill-current")}
                      />
                      <span className="sr-only">
                        {preferred
                          ? t("remove_from_preferred")
                          : t("mark_as_preferred")}
                      </span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 shrink-0 p-0 text-gray-500 hover:text-gray-900"
                    aria-label={t("remove_name", { name: pathText(entry) })}
                    disabled={disabled || (required && selectedIds.length <= 1)}
                    onClick={() => removeNode(nodeId)}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <select
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only max-w-px"
        name={name}
        multiple={props.mode === "multi"}
        value={props.mode === "multi" ? props.value : (props.value ?? "")}
        disabled={disabled}
        required={required}
        onChange={(event) => {
          if (props.mode === "multi")
            props.onChange(
              Array.from(
                event.target.selectedOptions,
                (option) => option.value,
              ),
            );
          else props.onChange(event.target.value || null);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          triggerRef.current?.focus();
        }}
      >
        {props.mode === "single" && <option value="">{triggerText}</option>}
        {entries.map((entry) => (
          <option
            key={entry.node.id}
            value={entry.node.id}
            disabled={linkedSet.has(entry.node.id)}
          >
            {pathText(entry)}
          </option>
        ))}
        {selectedEntries
          .filter((entry) => !byId.has(entry.node.id))
          .map((entry) => (
            <option key={entry.node.id} value={entry.node.id}>
              {entry.node.name}
            </option>
          ))}
      </select>
      <span className="sr-only max-w-px" role="status" aria-atomic="true">
        {selectedIds.length
          ? `${t("selected")}: ${selectedEntries.map(pathText).join(", ")}`
          : t("none")}
      </span>
      {description && (
        <FieldDescription id={`${fieldId}-description`}>
          {description}
        </FieldDescription>
      )}
      {validationError && (
        <FieldError id={`${fieldId}-error`}>{validationError}</FieldError>
      )}
    </Field>
  );
}

export { TreeSelect };
