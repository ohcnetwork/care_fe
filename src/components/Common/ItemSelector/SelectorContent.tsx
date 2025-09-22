import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  Cross2Icon,
  StarFilledIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SelectOption } from "./types";

// Subcomponent for rendering option items
function OptionItem({
  option,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  renderOption,
  enableFavorites,
}: {
  option: SelectOption;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite?: (option: SelectOption) => void;
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  enableFavorites?: boolean;
}) {
  return (
    <CommandItem
      key={option.value}
      value={option.label}
      onSelect={onSelect}
      className={cn(
        "cursor-pointer",
        option.disabled && "opacity-50 pointer-events-none",
      )}
      disabled={option.disabled}
    >
      {renderOption ? (
        renderOption(option, isSelected)
      ) : (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {option.icon}
            <span className="text-wrap">{option.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {enableFavorites && onToggleFavorite && (
              <FavoriteToggleButton
                isFavorite={isFavorite}
                onToggle={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(option);
                }}
              />
            )}
            {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
          </div>
        </div>
      )}
    </CommandItem>
  );
}

// Favorite toggle button component
function FavoriteToggleButton({
  isFavorite,
  onToggle,
}: {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
    >
      {isFavorite ? (
        <StarFilledIcon className="h-4 w-4" />
      ) : (
        <StarIcon className="h-4 w-4" />
      )}
    </button>
  );
}

// Clear selection item component
function ClearSelectionItem({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <CommandItem onSelect={onClear} className="cursor-pointer">
      <div className="flex items-center text-destructive">
        <Cross2Icon className="mr-2 h-4 w-4" />
        <span>{t("clear_selection")}</span>
      </div>
    </CommandItem>
  );
}

// Favorites header component
function FavoritesHeader({
  onClearAllFavorites,
  hasFavorites,
}: {
  onClearAllFavorites?: () => void;
  hasFavorites: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-normal text-gray-700 p-1">
        {t("starred")}
      </span>
      {hasFavorites && onClearAllFavorites && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClearAllFavorites();
          }}
          className="h-6 px-1 text-xs text-gray-500 hover:text-gray-700"
        >
          {t("clear")}
        </Button>
      )}
    </div>
  );
}

// Empty favorites message component
function EmptyFavoritesMessage({
  noFavoritesMessage,
}: {
  noFavoritesMessage: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center flex-col justify-center text-xs text-gray-500 p-4">
      <p>{noFavoritesMessage}</p>
      <p>{t("click_star_to_add")}</p>
    </div>
  );
}

// Options list component
function OptionsList<T>({
  options,
  selectedValues,
  favoriteItems,
  enableFavorites,
  handleSelect,
  onToggleFavorite,
  renderOption,
}: {
  options: SelectOption<T>[];
  selectedValues: string[];
  favoriteItems?: SelectOption<T>[];
  enableFavorites?: boolean;
  handleSelect: (value: string) => void;
  onToggleFavorite?: (option: SelectOption<T>) => void;
  renderOption?: (
    option: SelectOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
}) {
  return (
    <>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        const isFavorite =
          enableFavorites &&
          favoriteItems?.some((item) => item.value === option.value);

        return (
          <OptionItem
            key={option.value}
            option={option}
            isSelected={isSelected}
            isFavorite={isFavorite || false}
            onSelect={() => handleSelect(option.value)}
            onToggleFavorite={onToggleFavorite}
            renderOption={renderOption}
            enableFavorites={enableFavorites}
          />
        );
      })}
    </>
  );
}

// Favorites list component
function FavoritesList<T>({
  favoriteItems,
  noFavoritesMessage,
  searchValue,
  selectedValues,
  handleSelect,
  onToggleFavorite,
  onClearAllFavorites,
}: {
  favoriteItems?: SelectOption<T>[];
  noFavoritesMessage: string;
  searchValue: string;
  selectedValues: string[];
  handleSelect: (value: string) => void;
  onToggleFavorite?: (option: SelectOption<T>) => void;
  onClearAllFavorites?: () => void;
}) {
  const hasFavorites = favoriteItems && favoriteItems.length > 0;

  return (
    <CommandGroup className="h-full overflow-auto">
      <FavoritesHeader
        onClearAllFavorites={onClearAllFavorites}
        hasFavorites={hasFavorites || false}
      />

      {!hasFavorites ? (
        <EmptyFavoritesMessage noFavoritesMessage={noFavoritesMessage} />
      ) : (
        favoriteItems
          .filter(
            (option) =>
              !searchValue ||
              option.label.toLowerCase().includes(searchValue.toLowerCase()),
          )
          .map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <OptionItem
                key={option.value}
                option={option}
                isSelected={isSelected}
                isFavorite={true}
                onSelect={() => handleSelect(option.value)}
                onToggleFavorite={onToggleFavorite}
                enableFavorites={true}
              />
            );
          })
      )}
    </CommandGroup>
  );
}

export interface SelectorContentProps<T = any> {
  title?: string;
  searchPlaceholder: string;
  onSearch?: (query: string) => void;
  isIOS: boolean;
  loading: boolean;
  filteredOptions: SelectOption<T>[];
  noResultsMessage: string;
  favoritesLayout: "none" | "tabs" | "sideBySide";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  enableFavorites: boolean;
  clearable: boolean;
  selectedValues: string[];
  handleClear: () => void;
  handleSelect: (value: string) => void;
  favoriteItems?: SelectOption<T>[];
  onToggleFavorite?: (option: SelectOption<T>) => void;
  onClearAllFavorites?: () => void;
  noFavoritesMessage: string;
  renderOption?: (
    option: SelectOption<T>,
    isSelected: boolean,
  ) => React.ReactNode;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

// Main SelectorContent component
export function SelectorContent<T>({
  title,
  searchPlaceholder,
  onSearch,
  isIOS,
  loading,
  filteredOptions,
  noResultsMessage,
  favoritesLayout,
  activeTab,
  setActiveTab,
  enableFavorites,
  clearable,
  selectedValues,
  handleClear,
  handleSelect,
  favoriteItems,
  onToggleFavorite,
  onClearAllFavorites,
  noFavoritesMessage,
  renderOption,
  searchValue,
  setSearchValue,
}: SelectorContentProps<T>) {
  const { t } = useTranslation();

  return (
    <Command filter={onSearch ? () => 1 : undefined} className="rounded-t-3xl">
      {title && <h3 className="text-base font-semibold px-3">{title}</h3>}
      <div className="py-2 px-2 border-b border-gray-200 flex justify-between items-center">
        {favoritesLayout === "tabs" && enableFavorites && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:hidden"
          >
            <TabsList className="flex w-full">
              <TabsTrigger value="search" className="flex-1">
                {t("search")}
              </TabsTrigger>
              <TabsTrigger value="starred" className="flex-1">
                {t("starred")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <CommandInput
        placeholder={searchPlaceholder}
        onValueChange={(value) => {
          setSearchValue(value);
          onSearch?.(value);
        }}
        className="outline-hidden border-none ring-0 shadow-none text-base md:text-sm"
        autoFocus={!isIOS}
      />

      <CommandList className="">
        {loading ? (
          <CardListSkeleton count={3} />
        ) : filteredOptions.length === 0 &&
          (favoritesLayout !== "tabs" || activeTab === "search") ? (
          <CommandEmpty>{noResultsMessage}</CommandEmpty>
        ) : null}

        {favoritesLayout === "sideBySide" && enableFavorites ? (
          <div className="flex">
            <div className="w-1/2 overflow-auto">
              <CommandGroup>
                {clearable && selectedValues.length > 0 && (
                  <ClearSelectionItem onClear={handleClear} />
                )}
                <OptionsList
                  options={filteredOptions}
                  selectedValues={selectedValues}
                  favoriteItems={favoriteItems}
                  enableFavorites={enableFavorites}
                  handleSelect={handleSelect}
                  onToggleFavorite={onToggleFavorite}
                  renderOption={renderOption}
                />
              </CommandGroup>
            </div>

            <div className="w-1/2 border-l border-gray-200">
              <FavoritesList
                favoriteItems={favoriteItems}
                noFavoritesMessage={noFavoritesMessage}
                searchValue={searchValue}
                selectedValues={selectedValues}
                handleSelect={handleSelect}
                onToggleFavorite={onToggleFavorite}
                onClearAllFavorites={onClearAllFavorites}
              />
            </div>
          </div>
        ) : (
          <>
            {(favoritesLayout !== "tabs" || activeTab === "search") && (
              <CommandGroup>
                {clearable && selectedValues.length > 0 && (
                  <ClearSelectionItem onClear={handleClear} />
                )}
                <OptionsList
                  options={filteredOptions}
                  selectedValues={selectedValues}
                  favoriteItems={favoriteItems}
                  enableFavorites={enableFavorites}
                  handleSelect={handleSelect}
                  onToggleFavorite={onToggleFavorite}
                  renderOption={renderOption}
                />
              </CommandGroup>
            )}

            {favoritesLayout === "tabs" &&
              enableFavorites &&
              activeTab === "starred" && (
                <FavoritesList
                  favoriteItems={favoriteItems}
                  noFavoritesMessage={noFavoritesMessage}
                  searchValue={searchValue}
                  selectedValues={selectedValues}
                  handleSelect={handleSelect}
                  onToggleFavorite={onToggleFavorite}
                  onClearAllFavorites={onClearAllFavorites}
                />
              )}
          </>
        )}
      </CommandList>
    </Command>
  );
}
