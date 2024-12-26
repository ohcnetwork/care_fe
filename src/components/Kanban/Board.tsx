import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ReactNode, RefObject, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { callApi } from "@/Utils/request/query";
import { QueryRoute } from "@/Utils/request/types";
import { QueryOptions } from "@/Utils/request/useQuery";

interface KanbanBoardProps<T extends { id: string }> {
  title?: ReactNode;
  onDragEnd: OnDragEndResponder<string>;
  sections: {
    id: string;
    title: ReactNode;
    fetchOptions: (
      id: string,
      ...args: unknown[]
    ) => {
      route: QueryRoute<unknown>;
      options?: QueryOptions<unknown>;
    };
  }[];
  itemRender: (item: T) => ReactNode;
}

export default function KanbanBoard<T extends { id: string }>(
  props: KanbanBoardProps<T>,
) {
  const board = useRef<HTMLDivElement>(null);

  return (
    <div className="h-[calc(100vh-114px)] md:h-[calc(100vh-50px)]">
      <div className="flex flex-col items-end justify-between md:flex-row">
        <div>{props.title}</div>
        <div className="flex items-center gap-2 py-2">
          {[0, 1].map((button, i) => (
            <button
              key={i}
              onClick={() => {
                board.current?.scrollBy({
                  left: button ? 250 : -250,
                  behavior: "smooth",
                });
              }}
              className="inline-flex aspect-square h-8 items-center justify-center rounded-full border border-secondary-400 bg-secondary-200 text-2xl hover:bg-secondary-300"
            >
              <CareIcon icon={`l-${button ? "arrow-right" : "arrow-left"}`} />
            </button>
          ))}
        </div>
      </div>
      <DragDropContext onDragEnd={props.onDragEnd}>
        <div className="h-full overflow-x-auto scrollbar-hide" ref={board}>
          <div className="flex items-stretch px-0 pb-2">
            {props.sections.map((section, i) => (
              <KanbanSection<T>
                key={i}
                section={section}
                itemRender={props.itemRender}
                boardRef={board}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

interface QueryResponse<T> {
  results: T[];
  next: string | null;
  count: number;
}

export function KanbanSection<T extends { id: string }>(
  props: Omit<KanbanBoardProps<T>, "sections" | "onDragEnd"> & {
    section: KanbanBoardProps<T>["sections"][number];
    boardRef: RefObject<HTMLDivElement>;
  },
) {
  const { section } = props;
  const sectionRef = useRef<HTMLDivElement>(null);
  const defaultLimit = 14;
  const { t } = useTranslation();
  const options = section.fetchOptions(section.id);
  const fetchPage = async ({ pageParam = 0 }) => {
    try {
      const data = await callApi(options.route, {
        ...options.options,
        queryParams: {
          ...options.options?.query,
          offset: pageParam,
          limit: defaultLimit,
        },
      });
      return data as QueryResponse<T>;
    } catch (error) {
      console.error("Error fetching section data:", error);
      return { results: [], next: null, count: 0 };
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["board", section.id, options.options?.query],
    queryFn: fetchPage,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.next) return undefined;
      return pages.length * defaultLimit;
    },
    initialPageParam: 0,
  });

  const items = data?.pages?.flatMap((page) => page.results || []) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  useEffect(() => {
    refetch();
  }, [section.id, refetch]);

  return (
    <Droppable droppableId={section.id}>
      {(provided, _snapshot) => (
        <div
          ref={provided.innerRef}
          className="relative mr-2 w-[300px] shrink-0 rounded-xl bg-secondary-200"
        >
          <div className="sticky top-0 rounded-xl bg-secondary-200 pt-2">
            <div className="mx-2 flex items-center justify-between rounded-lg border border-secondary-300 bg-white p-4">
              <div>{section.title}</div>
              <div>
                <span className="ml-2 rounded-lg bg-secondary-300 px-2">
                  {isLoading ? "..." : totalCount}
                </span>
              </div>
            </div>
          </div>
          <div
            ref={sectionRef}
            className="h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              if (
                target.scrollTop + target.clientHeight >=
                target.scrollHeight - 100
              ) {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }
            }}
          >
            {!isLoading && items.length === 0 && (
              <div className="flex items-center justify-center py-10 text-secondary-500">
                {t("no_results_found")}
              </div>
            )}
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, _snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mx-2 mt-2 w-[284px] rounded-lg border border-secondary-300 bg-white"
                  >
                    {props.itemRender(item)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {isFetchingNextPage && (
              <div className="mt-2 h-[300px] w-[284px] animate-pulse rounded-lg bg-secondary-300" />
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

export type KanbanBoardType = typeof KanbanBoard;
