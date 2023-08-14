export interface PaginatedResponse<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

// export default function usePaginatedQuery<TItem>(
//   queryKey: keyof typeof routes,
//   options: Options = {}
// ) {
//   const [offset, setOffset] = useState(0);
//   const [limit, setLimit] = useState(options.limit ?? 14);
//   const [filters, setFilters] = useState<Record<string, string>>({});
//   const [items, setItems] = useState<TItem[]>([]);

//   const _query = useQuery<PaginatedResponse<TItem>>(queryKey, {
//     query: {
//       ...filters,
//       offset: `${offset}`,
//       limit: `${limit}`,
//     },
//     pathParams: options.pathParams,
//     onSuccess: ({ results }) => setItems(results),
//   });

//   const { data } = _query;

//   const nextPage = () => {
//     if (data?.next) {
//       setOffset(offset + limit);
//     }
//   };

//   const previousPage = () => {
//     if (data?.previous) {
//       const newOffset = offset - limit;
//       setOffset(newOffset < 0 ? 0 : newOffset);
//     }
//   };

//   return {
//     ..._query,
//     total: data?.count ?? null,
//     items,
//     nextPage,
//     previousPage,
//     setFilters,
//     offset,
//     setOffset,
//     limit,
//     setLimit,
//   };
// }
