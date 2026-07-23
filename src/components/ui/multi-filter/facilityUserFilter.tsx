import { useQuery } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { Avatar } from "@/components/Common/Avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import useAuthUser from "@/hooks/useAuthUser";
import facilityApi from "@/types/facility/facilityApi";
import { UserReadMinimal } from "@/types/user/user";

import FilterHeader from "./filterHeader";
import { FilterConfig, FilterDateRange } from "./utils/Utils";

function FacilityUserFilterDropdown({
  selectedUsers,
  onUsersChange,
  facilityId,
  handleBack,
}: {
  selectedUsers: UserReadMinimal[];
  onUsersChange: (users: UserReadMinimal[]) => void;
  facilityId: string;
  handleBack?: () => void;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const currentUser = useAuthUser();

  // Fetch facility users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["facilityUsers", facilityId, search],
    queryFn: query.debounced(facilityApi.getUsers, {
      pathParams: { facilityId },
      queryParams: {
        search_text: search,
        limit: "20",
      },
    }),
    enabled: !!facilityId,
  });

  const handleUserToggle = (user: UserReadMinimal) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      // Deselect if already selected
      onUsersChange([]);
    } else {
      // Single selection - replace any existing selection
      onUsersChange([user]);
    }
  };

  // Filter users: current user first (if not searching), then others
  const allUsers = usersData?.results || [];

  // Find current user in the list
  const currentUserInList = allUsers.find((u) => u.id === currentUser.id);

  // Separate users: selected first, then current user (if not selected), then others
  const selectedUserIds = new Set(selectedUsers.map((u) => u.id));
  const nonSelectedUsers = allUsers.filter((u) => !selectedUserIds.has(u.id));

  // Sort non-selected: current user first, then alphabetically
  const sortedNonSelectedUsers = nonSelectedUsers.sort((a, b) => {
    if (a.id === currentUser.id) return -1;
    if (b.id === currentUser.id) return 1;
    return formatName(a).localeCompare(formatName(b));
  });

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      handleBack?.();
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div>
      <div className="p-3 border-b">
        <Input
          placeholder={t("search_users_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 text-base sm:text-sm"
        />
      </div>
      <div className="p-3 max-h-[30vh] overflow-y-auto">
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("selected")}
            </div>
            {selectedUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleUserToggle(user);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox
                  checked={true}
                  className="data-[state=checked]:border-primary-700 text-white"
                />
                <div className="flex items-center gap-2 max-w-xs truncate">
                  <Avatar
                    imageUrl={user.profile_picture_url}
                    name={formatName(user, true)}
                    className="size-5 rounded-full"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">
                      {formatName(user)}
                      {user.id === currentUser.id && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({t("me")})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <div className="my-2 border-t border-gray-200" />
          </>
        )}

        {/* "Mine" quick option when not searching and current user not selected */}
        {!search &&
          !selectedUserIds.has(currentUser.id) &&
          currentUserInList && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("quick_select")}
              </div>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleUserToggle(currentUserInList);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={false} className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <Avatar
                    imageUrl={currentUserInList.profile_picture_url}
                    name={formatName(currentUserInList, true)}
                    className="size-5 rounded-full"
                  />
                  <span className="text-sm font-medium">{t("mine")}</span>
                </div>
              </DropdownMenuItem>
              <div className="my-2 border-t border-gray-200" />
            </>
          )}

        {/* Available Users */}
        {sortedNonSelectedUsers.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("available_users")}
            </div>
            {sortedNonSelectedUsers
              .filter((u) => search || u.id !== currentUser.id)
              .map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleUserToggle(user);
                  }}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                >
                  <Checkbox checked={false} className="h-4 w-4" />
                  <div className="flex items-center gap-2 max-w-xs truncate">
                    <Avatar
                      imageUrl={user.profile_picture_url}
                      name={formatName(user, true)}
                      className="size-5 rounded-full"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">
                        {formatName(user)}
                        {user.id === currentUser.id && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({t("me")})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {!isLoading && allUsers.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_users_found")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RenderFacilityUserFilter({
  filter,
  selectedUsers,
  onFilterChange,
  handleBack,
  facilityId,
}: {
  filter: FilterConfig;
  selectedUsers: UserReadMinimal[];
  onFilterChange: (
    filterKey: string,
    values: string[] | UserReadMinimal[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  if (!facilityId) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        {t("facility_required_for_facility_user_filter")}
      </div>
    );
  }

  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <FacilityUserFilterDropdown
        selectedUsers={selectedUsers}
        onUsersChange={(users) => {
          onFilterChange(filter.key, users);
        }}
        facilityId={facilityId}
        handleBack={handleBack}
      />
    </div>
  );
}

export const SelectedFacilityUserBadge = ({
  selected,
}: {
  selected: UserReadMinimal[];
}) => {
  if (selected.length === 0) return null;

  const user = selected[0];

  return (
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      <User className="h-3 w-3 text-gray-600 shrink-0" />
      <span className="text-sm whitespace-nowrap truncate max-w-[150px]">
        {formatName(user)}
      </span>
    </div>
  );
};
