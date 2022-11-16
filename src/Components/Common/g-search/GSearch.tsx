import React, { useCallback, useEffect, useMemo, useState } from "react";
import BadgeGroup from "./BadgeGroup";
import OptionsList from "./OptionsList";
import {
  SearchResult,
  SelectedFilters,
  GSearchProps as Props,
  Badge,
  Option,
  Selectables,
  Dependants,
  Dependant,
} from "./types";
import { defaultMatch } from "./utils";
import { Dialog } from "@headlessui/react";
import useKeyboardShortcut from "use-keyboard-shortcut";

// type types = "SET_SELECTED" | "SET_SEARCH_RESULTS" | "SET_SEARCH_QUERY" | "SET_DEPENDANTS" | "SET_DEPENDANTS_LOADING" | "SET_DEPENDANTS_ERROR" | "SET_DEPENDANTS_DATA";

// const reducer = (state, action) => {
//     switch (action.type) {
//         case types.

const GSearch = ({
  searchables = {},
  selectables = {},
  onChange,
  className,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  // console.log({
  //   data,
  //   searchResults,
  //   selectedTags,
  //   selectedFilters,
  //   searchables,
  //   selectables,
  // });

  useKeyboardShortcut(["Control", "G"], () => setIsOpen(true), {
    ignoreInputFields: false,
    overrideSystem: true,
  });

  const dependants: Dependants = useMemo(
    () =>
      Object.keys(selectables).reduce((acc, tag) => {
        selectables[tag].dependsOn?.forEach((dependant) => {
          if (!acc[dependant.tag]) {
            acc[dependant.tag] = [];
          }
          acc[dependant.tag].push({ tag, required: dependant.required });
        });
        return acc;
      }, {} as Dependants),
    [selectables]
  );

  const isDisabled = useCallback(
    (tag: string) =>
      selectables[tag]?.dependsOn?.every(
        (dependency) =>
          !dependency.required || !(selectedFilters[dependency.tag]?.size > 0)
      ) ?? false,
    [selectables, selectedFilters]
  );

  useEffect(() => {
    const onInit = async () => {
      const results = await Object.keys(selectables).reduce(
        async (acc, tag) => ({
          ...(await acc),
          [tag]:
            selectables[tag].data ??
            (await selectables[tag].fetchDataOnInit?.()) ??
            [],
        }),
        {} as any
      );

      setData(results);
      setSearchText("");
      setSelectedTags(
        Object.keys(selectables) // .filter((tag) => !isDisabled(tag))
      );
      setSearchResults([]);
      setSelectedFilters({});
    };
    onInit();
  }, [selectables]);

  const search = useCallback(
    async (tags: string[], selectables: Selectables, query: string) => {
      const $searchables = Object.keys(searchables).reduce((acc: any, tag) => {
        if (searchables[tag]?.match(query)) {
          acc.push({
            item: { id: tag, name: query },
            tag,
            type: "searchable",
            label: searchables[tag]?.label, // TODO: Possibly could send only the string instead of the function
            render: searchables[tag]?.render,
          });
        }
        return acc;
      }, [] as SearchResult[]);
      const $selectables = await tags.reduce(async (acc, tag) => {
        const items = []
          .concat(
            (data[tag]?.filter(
              (item: any) =>
                selectables[tag]?.match?.(query, item) ??
                defaultMatch(query, item)
            ) as []) ?? [],
            (await selectables[tag]?.fetchDataOnSearch?.(query)) ?? []
          )
          .map((item) => ({
            item,
            tag,
            type: "selectable",
            label: selectables[tag]?.label, // TODO: Possibly could send only the string instead of the function
            render: selectables[tag]?.render,
          }));

        return [...(await acc), ...items];
      }, [] as any);

      return [...$searchables, ...$selectables];
    },
    [data]
  );

  const removeResultsWithTags = useCallback((tags: string[]) => {
    setSearchResults((prev) =>
      prev.filter((result) => !tags.includes(result.tag))
    );
  }, []);

  const appendResultsForTags = useCallback(
    (tags: string[]) => {
      search(tags, selectables, searchText).then((results) => {
        setSearchResults((prev) => [...results, ...prev]);
      });
    },
    [search, selectables, searchText]
  );

  // TODO: handle selectedFilters of dependants on dependancy change

  useEffect(() => {
    const getSearchResults = async () => {
      const searchResults = await search(selectedTags, selectables, searchText);
      setSearchResults(searchResults);
    };

    getSearchResults();
  }, [searchText, search]);

  useEffect(() => {
    onChange?.(selectedFilters);
  }, [onChange, selectedFilters]);

  const selectFilter = useCallback(
    (filter: any, tag: string, _type: string) => {
      setSelectedFilters((prev) => {
        if (prev[tag] && selectables[tag]?.multiple) {
          return {
            ...prev,
            [tag]: prev[tag].add(filter),
          };
        }

        return {
          ...prev,
          [tag]: new Set([filter]),
        };
      });

      selectables[tag]?.onSelect?.(filter);

      dependants[tag]?.forEach(async (dependant: Dependant) => {
        const results = await selectables[
          dependant.tag
        ]?.fetctDataOnDependancyChange?.(
          filter,
          tag,
          data[dependant.tag],
          "select"
        );

        if (results) {
          setData((prev: any) => ({ ...prev, [dependant.tag]: results }));
        }
      });
    },
    [selectables]
  );

  const deSelectFilter = useCallback(
    (filter: any, tag: string, _type: string) => {
      setSelectedFilters((prev) => {
        if (prev[tag].size === 1) {
          const { [tag]: _, ...rest } = prev;
          return rest;
        }

        const newSet = new Set(prev[tag]);
        newSet.delete(filter);
        return { ...prev, [tag]: newSet };
      });

      selectables[tag]?.onDeSelect?.(filter);

      dependants[tag]?.forEach(async (dependant: Dependant) => {
        const results = await selectables[
          dependant.tag
        ]?.fetctDataOnDependancyChange?.(
          filter,
          tag,
          data[dependant.tag],
          "deselect"
        );

        // TODO: remove dependants from selected filters

        if (results) {
          setData((prev: any) => ({ ...prev, [dependant.tag]: results }));
        }
      });
    },
    []
  );

  return (
    <>
      <button
        className={
          "flex items-center space-x-2 border border-gray-900/10 bg-white shadow-sm px-3 py-2 hover:border-gray-300 focus:outline-none focus:border-gray-300 rounded " +
          className
        }
        onClick={() => setIsOpen(true)}
      >
        <i className="text-gray-400 -ml-1 fa fa-magnifying-glass"></i>
        <span className="text-sm text-gray-400 flex-1 text-left">Search</span>
        <span className="flex-none text-xs font-semibold text-gray-400">
          Ctrl + G
        </span>
      </button>

      <Dialog
        className="fixed inset-0 z-50 justify-center items-start"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <Dialog.Overlay
          // as={"template"}
          className="fixed inset-0 bg-black/30 -z-10"
        />
        <div className="w-3/4 mt-16 m-auto">
          <div className="shadow-sm block p-3 sm:text-sm border-2 border-gray-400 rounded-md bg-white">
            <input
              type="text"
              name="search"
              id="searchbar"
              className="block p-3 sm:text-sm w-full bg-white focus:ring-0 focus:ring-offset-0 focus:outline-none z-50"
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Start typing to search..."
            />

            <BadgeGroup
              badges={Object.keys(selectedFilters).reduce(
                (acc: Badge[], tag) => [
                  ...acc,
                  ...Array.from(selectedFilters[tag]).map(
                    (filter) =>
                      ({
                        label: `${tag} : ${
                          selectables[tag]?.label?.(filter) ?? filter.name
                        }`,
                        selected: true,
                        trailingIcon: <button>x</button>,
                        trailingIconOnClick: () =>
                          deSelectFilter(filter, tag, ""),
                      } as Badge)
                  ),
                ],
                []
              )}
              badgeClassName="hover:!cursor-default hover:!bg-green-600"
            />
          </div>

          {searchText && (
            <div className="z-10 flex flex-col bg-white h-[50vh] rounded-md shadow-sm">
              <BadgeGroup
                badges={Object.keys(selectables).map((tag) => ({
                  label: selectables[tag]?.badge || tag,
                  key: tag,
                  selected: selectedTags.includes(tag),
                  disabled: selectables[tag].dependsOn?.every(
                    (dependency) =>
                      !dependency.required ||
                      !(selectedFilters[dependency.tag]?.size > 0)
                  ),
                  onClick: () => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                      removeResultsWithTags([tag]);
                    } else {
                      setSelectedTags([tag, ...selectedTags]);
                      appendResultsForTags([tag]);
                    }
                  },
                }))}
                badgeClassName="px-3"
              />

              <OptionsList
                options={searchResults as Option[]}
                list="row"
                onSelect={selectFilter}
                filter={(item, tag, _type) =>
                  (Array.from(selectedFilters[tag] ?? []).some(
                    (filter) => !selectables[tag]?.compare?.(filter, item)
                  ) ||
                    !selectedFilters[tag]?.has(item)) &&
                  !isDisabled(tag)
                }
              />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default GSearch;
