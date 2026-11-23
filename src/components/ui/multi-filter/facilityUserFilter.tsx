import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import useAuthUser from "@/hooks/useAuthUser";
import facilityApi from "@/types/facility/facilityApi";
import { UserReadMinimal } from "@/types/user/user";

import { FilterChoiceItem } from "./filterChoiceItem";
import FilterHeader from "./filterHeader";
import {
  FilterMenuList,
  FilterMenuSearch,
  useFilterMenuSearch,
} from "./filterMenuSearch";
import { FilterConfig, FilterDateRange } from "./utils/Utils";

function FacilityUserFilterDropdown({
  selectedUsers,
  onUsersChange,
  facilityId,
  onBack,
}: {
  selectedUsers: UserReadMinimal[];
  onUsersChange: (users: UserReadMinimal[]) => void;
  facilityId: string;
  onBack?: () => void;
}) {
  const { search } = useFilterMenuSearch();
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

  // Filter users: current user first (if not searching), then others
  const allUsers = usersData?.results || [];

  // Find current user in the list
  const currentUserInList = allUsers.find((u) => u.id === currentUser.id);

  // Separate users: selected first, then current user (if not selected), then others
  const selectedUserIds = new Set(selectedUsers.map((u) => u.id));
  const availableUsers = allUsers
    .filter(
      (u) => !selectedUserIds.has(u.id) && (search || u.id !== currentUser.id),
    )
    .sort((a, b) => {
      if (a.id === currentUser.id) return -1;
      if (b.id === currentUser.id) return 1;
      return formatName(a).localeCompare(formatName(b));
    });

  const renderUser = (user: UserReadMinimal, mine = false) => (
    <FilterChoiceItem
      key={user.id}
      checked={selectedUserIds.has(user.id)}
      onChoose={() => onUsersChange([user])}
    >
      <Avatar
        imageUrl={user.profile_picture_url}
        name={formatName(user, true)}
        className="size-5 rounded-full"
      />
      <span className="truncate">
        {mine ? t("mine") : formatName(user)}
        {!mine && user.id === currentUser.id && (
          <span className="ms-1 text-xs text-muted-foreground">
            ({t("me")})
          </span>
        )}
      </span>
    </FilterChoiceItem>
  );

  return (
    <div>
      <div className="p-3 border-b">
        <FilterMenuSearch
          placeholder={t("search_users_placeholder")}
          onBack={onBack}
        />
      </div>
      <FilterMenuList className="p-3 max-h-[30vh] overflow-y-auto">
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <>
            <DropdownMenuLabel>{t("selected")}</DropdownMenuLabel>
            {selectedUsers.map((user) => renderUser(user))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* "Mine" quick option when not searching and current user not selected */}
        {!search &&
          !selectedUserIds.has(currentUser.id) &&
          currentUserInList && (
            <>
              <DropdownMenuLabel>{t("quick_select")}</DropdownMenuLabel>
              {renderUser(currentUserInList, true)}
              <DropdownMenuSeparator />
            </>
          )}

        {/* Available Users */}
        {availableUsers.length > 0 && (
          <>
            <DropdownMenuLabel>{t("available_users")}</DropdownMenuLabel>
            {availableUsers.map((user) => renderUser(user))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Spinner className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {!isLoading && allUsers.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_users_found")}
          </div>
        )}
      </FilterMenuList>
    </div>
  );
}

export default function RenderFacilityUserFilter({
  filter,
  selectedUsers,
  onFilterChange,
  handleBack,
  handleClose,
  facilityId,
}: {
  filter: FilterConfig;
  selectedUsers: UserReadMinimal[];
  onFilterChange: (
    filterKey: string,
    values: string[] | UserReadMinimal[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
  handleClose?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  if (!facilityId) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        {filter.type === "care_team"
          ? t("facility_required_for_care_team_filter")
          : t("facility_required_for_facility_user_filter")}
      </div>
    );
  }

  return (
    <div className="p-0">
      {(handleBack || handleClose) && (
        <FilterHeader
          label={t(filter.label)}
          icon={filter.icon}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}
      <FacilityUserFilterDropdown
        selectedUsers={selectedUsers}
        onUsersChange={(users) => {
          onFilterChange(filter.key, users);
        }}
        facilityId={facilityId}
        onBack={handleBack}
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
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <User className="h-3 w-3 text-gray-600 shrink-0" />
      <span className="block min-w-0 flex-1 truncate text-sm whitespace-nowrap">
        {formatName(user)}
      </span>
    </div>
  );
};
