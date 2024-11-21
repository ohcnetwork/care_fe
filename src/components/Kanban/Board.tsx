import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import request from "@/Utils/request/request";
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
        <div className="h-full overflow-scroll" ref={board}>
          <div className="flex items-stretch px-0 pb-2 max-[915px]:flex-wrap max-[915px]:gap-5 max-[915px]:mb-5">
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

export function KanbanSection<T extends { id: string }>(
  props: Omit<KanbanBoardProps<T>, "sections" | "onDragEnd"> & {
    section: KanbanBoardProps<T>["sections"][number];
    boardRef: RefObject<HTMLDivElement>;
  },
) {
  const { section } = props;
  const [offset, setOffset] = useState(0);
  const [pages, setPages] = useState<T[][]>([]);
  const [fetchingNextPage, setFetchingNextPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number>();

  const options = section.fetchOptions(section.id);
  const sectionRef = useRef<HTMLDivElement>(null);
  const defaultLimit = 14;
  const { t } = useTranslation();

  // should be replaced with useInfiniteQuery when we move over to react query

  const fetchNextPage = async (refresh: boolean = false) => {
    if (!refresh && (fetchingNextPage || !hasMore)) return;
    if (refresh) setPages([]);
    const offsetToUse = refresh ? 0 : offset;
    setFetchingNextPage(true);
    const res = await request(options.route, {
      ...options.options,
      query: { ...options.options?.query, offsetToUse, limit: defaultLimit },
    });
    const newPages = refresh ? [] : [...pages];
    const page = Math.floor(offsetToUse / defaultLimit);
    if (res.error) return;
    newPages[page] = (res.data as any).results;
    setPages(newPages);
    setHasMore(!!(res.data as any)?.next);
    setTotalCount((res.data as any)?.count);
    setOffset(offsetToUse + defaultLimit);
    setFetchingNextPage(false);
  };

  const items = pages.flat();

  useEffect(() => {
    const onBoardReachEnd = async () => {
      const sectionElementHeight =
        sectionRef.current?.getBoundingClientRect().height;
      const scrolled = props.boardRef.current?.scrollTop;
      // if user has scrolled 3/4th of the current items
      if (
        scrolled &&
        sectionElementHeight &&
        scrolled > sectionElementHeight * (3 / 4)
      ) {
        fetchNextPage();
      }
    };

    props.boardRef.current?.addEventListener("scroll", onBoardReachEnd);
    return () =>
      props.boardRef.current?.removeEventListener("scroll", onBoardReachEnd);
  }, [props.boardRef, fetchingNextPage, hasMore]);

  useEffect(() => {
    fetchNextPage(true);
  }, [props.section]);

  return (
    <Droppable droppableId={section.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          className={
            "relative mr-2 w-[300px] shrink-0 rounded-xl bg-secondary-200 max-[915px]:border max-[915px]:border-solid max-[915px]:border-[rgb(168,168,168)]"
          }
        >
          <div className="sticky top-0 rounded-xl bg-secondary-200 pt-2">
            <div className="mx-2 flex items-center justify-between rounded-lg border border-secondary-300 bg-white p-4">
              <div>{section.title}</div>
              <div>
                <span className="ml-2 rounded-lg bg-secondary-300 px-2">
                  {typeof totalCount === "undefined" ? "..." : totalCount}
                </span>
              </div>
            </div>
          </div>
          <div ref={sectionRef}>
            {!fetchingNextPage && totalCount === 0 && (
              <div className="flex items-center justify-center py-10 text-secondary-500">
                {t("no_results_found")}
              </div>
            )}
            {items
              .filter((item) => item)
              .map((item, i) => (
                <Draggable draggableId={item.id} key={i} index={i}>
                  {(provided) => (
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
            {fetchingNextPage && (
              <div className="mt-2 h-[300px] w-[284px] animate-pulse rounded-lg bg-secondary-300" />
            )}
          </div>
        </div>
      )}
    </Droppable>
  );
}

export type KanbanBoardType = typeof KanbanBoard;
