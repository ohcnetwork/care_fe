import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { Muted } from "@/components/ui/typography";

import mutate from "@/Utils/request/mutate";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

interface Props {
  facilityId: string;
  tokenCategory: TokenCategoryRead;
}

/**
 * Makes a token category the default for its resource type. Applied
 * immediately, independent of the edit form. There's no API to unset a
 * default; another category has to be made the default instead.
 */
export function TokenCategoryDefaultFrame({
  facilityId,
  tokenCategory,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    mutate: setDefault,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: mutate(tokenCategoryApi.setDefault, {
      pathParams: { facility_id: facilityId, id: tokenCategory.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokenCategories"] });
      // Used by the token generation sheet to preselect the default category
      queryClient.invalidateQueries({ queryKey: ["token_categories"] });
      toast.success(
        t("token_category_set_as_default_success", {
          name: tokenCategory.name,
        }),
      );
    },
  });

  const isDefault = tokenCategory.default || isSuccess;
  const resourceType = t(tokenCategory.resource_type);

  return (
    <Frame className="mt-4" data-cy="token-category-default">
      <FramePanel className="flex flex-col items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            {t("token_category_default")}
            {isDefault && (
              <Badge variant="primary">
                <Star className="fill-current" />
                {t("default")}
              </Badge>
            )}
          </div>
          <Muted>
            {t(
              isDefault
                ? "token_category_default_locked"
                : "token_category_default_description",
              { resource_type: resourceType },
            )}
          </Muted>
        </div>
        {!isDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDefault({})}
            disabled={isPending}
          >
            {isPending ? <Spinner className="size-4" /> : <Star />}
            {t("set_as_default")}
          </Button>
        )}
      </FramePanel>
    </Frame>
  );
}
