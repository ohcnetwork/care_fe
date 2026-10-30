import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  SCHEDULABLE_RESOURCE_TYPE_COLORS,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import {
  TokenCategoryCreate,
  TokenCategoryRead,
  TokenCategoryUpdate,
} from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

/**
 * Edit page for a token category. Creation happens inline from the token
 * category list, grouped by resource type.
 */
export default function TokenCategoryForm({
  facilityId,
  tokenCategoryId,
}: {
  facilityId: string;
  tokenCategoryId: string;
}) {
  const { t } = useTranslation();

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["tokenCategory", tokenCategoryId],
    queryFn: query(tokenCategoryApi.get, {
      pathParams: {
        facility_id: facilityId,
        id: tokenCategoryId,
      },
    }),
  });

  return (
    <Page title={t("edit_token_category")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("edit_token_category")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("edit_token_category_description")}
          </p>
        </div>
        {isFetching || !existingData ? (
          <FormSkeleton rows={4} />
        ) : (
          <TokenCategoryFormContent
            facilityId={facilityId}
            tokenCategoryId={tokenCategoryId}
            resourceType={existingData.resource_type}
            existingData={existingData}
            containerClassName="rounded-lg border border-gray-200 bg-white p-6"
          />
        )}
      </div>
    </Page>
  );
}

export function TokenCategoryFormContent({
  facilityId,
  tokenCategoryId,
  resourceType,
  existingData,
  containerClassName,
  onSuccess = () => navigate(`/facility/${facilityId}/settings/token_category`),
  onCancel = () => navigate(`/facility/${facilityId}/settings/token_category`),
  disableButtons = false,
  externalSubmitRef,
}: {
  facilityId: string;
  tokenCategoryId?: string;
  /**
   * Resource type of the token category. Set on create and immutable
   * afterwards, so it is not editable in the form.
   */
  resourceType: SchedulableResourceType;
  existingData?: TokenCategoryRead;
  containerClassName?: string;
  onSuccess?: (tokenCategory: TokenCategoryRead) => void;
  onCancel?: () => void;
  disableButtons?: boolean;
  externalSubmitRef?: React.RefObject<(() => void) | null>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(tokenCategoryId);

  const formSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    shorthand: z
      .string()
      .trim()
      .min(1, t("field_required"))
      .max(5, t("maximum_characters_allowed", { count: 5 })),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            name: existingData.name,
            shorthand: existingData.shorthand,
          }
        : {
            name: "",
            shorthand: "",
          },
  });

  const { mutate: createTokenCategory, isPending: isCreating } = useMutation({
    mutationFn: mutate(tokenCategoryApi.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: (tokenCategory: TokenCategoryRead) => {
      queryClient.invalidateQueries({ queryKey: ["tokenCategories"] });
      toast.success(t("token_category_created_successfully"));
      onSuccess?.(tokenCategory);
    },
  });

  const { mutate: updateTokenCategory, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenCategoryApi.update, {
      pathParams: {
        facility_id: facilityId,
        id: tokenCategoryId || "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokenCategories"] });
      queryClient.invalidateQueries({
        queryKey: ["tokenCategory", tokenCategoryId],
      });
      toast.success(t("token_category_updated_successfully"));
      navigate(`/facility/${facilityId}/settings/token_category`);
    },
  });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEditMode && tokenCategoryId) {
      const updatePayload: TokenCategoryUpdate = {
        name: data.name,
        shorthand: data.shorthand,
      };
      updateTokenCategory(updatePayload);
    } else {
      const createPayload: TokenCategoryCreate = {
        name: data.name,
        resource_type: resourceType,
        shorthand: data.shorthand,
      };
      createTokenCategory(createPayload);
    }
  }

  useEffect(() => {
    if (externalSubmitRef) {
      externalSubmitRef.current = () => {
        form.handleSubmit(onSubmit)();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSubmitRef]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={containerClassName}>
          <div className="space-y-4">
            {isEditMode && (
              <div className="space-y-2" data-cy="token-category-resource-type">
                <p className="text-sm font-medium text-gray-900">
                  {t("resource_type")}
                </p>
                <Badge variant={SCHEDULABLE_RESOURCE_TYPE_COLORS[resourceType]}>
                  {t(resourceType)}
                </Badge>
                <p className="text-sm text-gray-500">
                  {t("token_category_resource_type_immutable")}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_token_category_name")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("token_category_name_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shorthand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("shorthand")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_shorthand")} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("shorthand_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {!disableButtons && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : isEditMode ? t("update") : t("create")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
