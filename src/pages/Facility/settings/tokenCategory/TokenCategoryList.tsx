import { useQuery } from "@tanstack/react-query";
import { Search, SearchX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Muted,
  CareUIPageTitle as PageTitle,
} from "@/components/ui/typography";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

import { TokenCategoryGroup } from "./TokenCategoryGroup";
import {
  TokenCategorySheet,
  TokenCategorySheetState,
} from "./TokenCategorySheet";
import { TOKEN_CATEGORY_RESOURCE_TYPES } from "./tokenCategoryResourceTypes";

export default function TokenCategoryList({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<TokenCategorySheetState | null>(null);

  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canWriteTokenCategory } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  // A facility has only a handful of token categories, so fetch them all once
  // and group / search locally instead of paginating each group separately.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tokenCategories", facilityId],
    queryFn: query.paginated(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
    }),
  });

  const searchText = search.trim().toLowerCase();
  const tokenCategories = (data?.results ?? []).filter(
    (category) =>
      !searchText ||
      category.name.toLowerCase().includes(searchText) ||
      category.shorthand.toLowerCase().includes(searchText),
  );

  const groups = TOKEN_CATEGORY_RESOURCE_TYPES.map(({ type, icon }) => ({
    type,
    icon,
    tokenCategories: tokenCategories.filter(
      (category) => category.resource_type === type,
    ),
  }));
  // While searching, hide sections without matches so results stand out.
  const visibleGroups = searchText
    ? groups.filter((group) => group.tokenCategories.length > 0)
    : groups;

  return (
    <Page title={t("token_categories")} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl space-y-6 text-foreground">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageTitle>{t("token_categories")}</PageTitle>
            <Muted className="mt-2 max-w-2xl">
              {t("token_categories_description")}
            </Muted>
          </div>
          <InputGroup className="w-full bg-background sm:max-w-72">
            <InputGroupInput
              type="search"
              aria-label={t("search_token_categories")}
              placeholder={t("search_token_categories")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {isError ? (
          <div className="flex flex-wrap items-center gap-3">
            <FieldError>{t("token_categories_load_error")}</FieldError>
            <Button variant="outline" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : visibleGroups.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>{t("no_token_categories_found")}</EmptyTitle>
              <EmptyDescription>
                {t("no_token_categories_match_search", { search })}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <TokenCategoryGroup
                key={group.type}
                facilityId={facilityId}
                resourceType={group.type}
                icon={group.icon}
                tokenCategories={group.tokenCategories}
                isLoading={isLoading}
                canWrite={canWriteTokenCategory}
                onAdd={() =>
                  setSheet({ mode: "create", resourceType: group.type })
                }
                onEdit={(tokenCategory) =>
                  setSheet({ mode: "edit", tokenCategory })
                }
              />
            ))}
          </div>
        )}
      </div>

      <TokenCategorySheet
        facilityId={facilityId}
        state={sheet}
        onClose={() => setSheet(null)}
      />
    </Page>
  );
}
