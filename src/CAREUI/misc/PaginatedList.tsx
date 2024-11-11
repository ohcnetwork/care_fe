import { createContext, useContext, useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { CommonButtonProps } from "@/components/Common/ButtonV2";
import Pagination from "@/components/Common/Pagination";

import { PaginatedResponse, QueryRoute } from "@/Utils/request/types";
import useQuery, { QueryOptions } from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

const DEFAULT_PER_PAGE_LIMIT = 14;

interface PaginatedListContext<TItem>
  extends ReturnType<typeof useQuery<PaginatedResponse<TItem>>> {
  items: TItem[];
  perPage: number;
  currentPage: number;
  setPage: (page: number) => void;
}

const context = createContext<PaginatedListContext<object> | null>(null);

function useContextualized<TItem>() {
  const ctx = useContext(context);

  if (ctx === null) {
    throw new Error("Component must be used within a PaginatedList");
  }

  return ctx as PaginatedListContext<TItem>;
}

interface Props<TItem> extends QueryOptions<PaginatedResponse<TItem>> {
  route: QueryRoute<PaginatedResponse<TItem>>;
  perPage?: number;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  queryCB?: (
    query: ReturnType<typeof useQuery<PaginatedResponse<TItem>>>,
  ) => void;
  children: (
    ctx: PaginatedListContext<TItem>,
    query: ReturnType<typeof useQuery<PaginatedResponse<TItem>>>,
  ) => JSX.Element | JSX.Element[];
}

export default function PaginatedList<TItem extends object>({
  children,
  route,
  perPage = DEFAULT_PER_PAGE_LIMIT,
  queryCB,
  ...queryOptions
}: Props<TItem>) {
  const [currentPage, _setPage] = useState(queryOptions.initialPage ?? 1);

  const setPage = (page: number) => {
    _setPage(page);
    queryOptions.onPageChange?.(page);
  };

  const query = useQuery(route, {
    ...queryOptions,
    query: {
      ...queryOptions.query,
      limit: perPage,
      offset: (currentPage - 1) * perPage,
    },
  });

  const items = query.data?.results ?? [];

  useEffect(() => {
    if (queryCB) {
      queryCB(query);
    }
  }, [query]);

  return (
    <context.Provider
      value={{ ...query, items, perPage, currentPage, setPage }}
    >
      <context.Consumer>
        {(ctx) => children(ctx as PaginatedListContext<TItem>, query)}
      </context.Consumer>
    </context.Provider>
  );
}

interface WhenEmptyProps {
  className?: string;
  children: JSX.Element | JSX.Element[];
}

const WhenEmpty = <TItem extends object>(props: WhenEmptyProps) => {
  const { items, loading } = useContextualized<TItem>();

  if (loading || items.length > 0) {
    return null;
  }

  return <div className={props.className}>{props.children}</div>;
};

PaginatedList.WhenEmpty = WhenEmpty;

const WhenLoading = <TItem extends object>(props: WhenEmptyProps) => {
  const { loading } = useContextualized<TItem>();

  if (!loading) {
    return null;
  }

  return <div className={props.className}>{props.children}</div>;
};

PaginatedList.WhenLoading = WhenLoading;

const Refresh = ({ label = "Refresh", ...props }: CommonButtonProps) => {
  const { loading, refetch } = useContextualized<object>();

  return (
    <ButtonV2
      variant="secondary"
      border
      {...props}
      onClick={() => refetch()}
      disabled={loading}
    >
      <CareIcon
        icon="l-sync"
        className={classNames("text-lg", loading && "animate-spin")}
      />
      <span>{label}</span>
    </ButtonV2>
  );
};

PaginatedList.Refresh = Refresh;

interface ItemsProps<TItem> {
  className?: string;
  children: (item: TItem, items: TItem[]) => JSX.Element | JSX.Element[];
  shimmer?: JSX.Element;
  shimmerCount?: number;
}

const Items = <TItem extends object>(props: ItemsProps<TItem>) => {
  const { loading, items } = useContextualized<TItem>();

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <ul className={props.className}>
      {loading && props.shimmer
        ? Array.from({ length: props.shimmerCount ?? 8 }).map((_, i) => (
            <li key={i} className="w-full">
              {props.shimmer}
            </li>
          ))
        : items.map((item, index, items) => (
            <li key={index} className="w-full">
              {props.children(item, items)}
            </li>
          ))}
    </ul>
  );
};

PaginatedList.Items = Items;

interface PaginatorProps {
  className?: string;
  hideIfSinglePage?: boolean;
}

const Paginator = <TItem extends object>({
  className,
  hideIfSinglePage,
}: PaginatorProps) => {
  const { data, perPage, currentPage, setPage } = useContextualized<object>();
  const { loading } = useContextualized<TItem>();

  if (loading) {
    return null;
  }

  if (hideIfSinglePage && (data?.count ?? 0) <= perPage) {
    return null;
  }

  return (
    <Pagination
      className={className}
      cPage={currentPage}
      data={{ totalCount: data?.count ?? 0 }}
      defaultPerPage={perPage}
      onChange={setPage}
    />
  );
};

PaginatedList.Paginator = Paginator;
