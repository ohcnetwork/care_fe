import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { SheetBody, SheetFooter } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";

import mutate from "@/Utils/request/mutate";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

import { TokenCategoryDefaultFrame } from "./TokenCategoryDefaultFrame";
import {
  TOKEN_CATEGORY_RESOURCE_TYPE_ICONS,
  tokenNumberPreview,
} from "./tokenCategoryResourceTypes";

const SHORTHAND_MAX_LENGTH = 5;

interface Props {
  facilityId: string;
  /**
   * Set by the section the category is created from. Immutable afterwards:
   * the backend's update spec doesn't accept it.
   */
  resourceType: SchedulableResourceType;
  tokenCategory?: TokenCategoryRead;
  onSaved: (tokenCategory: TokenCategoryRead) => void;
  onCancel: () => void;
}

export function TokenCategoryForm({
  facilityId,
  resourceType,
  tokenCategory,
  onSaved,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = !!tokenCategory;
  const ResourceIcon = TOKEN_CATEGORY_RESOURCE_TYPE_ICONS[resourceType];

  const formSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    shorthand: z
      .string()
      .trim()
      .min(1, t("field_required"))
      .max(
        SHORTHAND_MAX_LENGTH,
        t("maximum_characters_allowed", { count: SHORTHAND_MAX_LENGTH }),
      ),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tokenCategory?.name ?? "",
      shorthand: tokenCategory?.shorthand ?? "",
    },
  });
  const shorthand = useWatch({ control: form.control, name: "shorthand" });

  const handleSaved = (saved: TokenCategoryRead) => {
    queryClient.invalidateQueries({ queryKey: ["tokenCategories"] });
    // Used by the token generation sheet to preselect the default category
    queryClient.invalidateQueries({ queryKey: ["token_categories"] });
    toast.success(
      t(
        isEdit
          ? "token_category_updated_successfully"
          : "token_category_created_successfully",
      ),
    );
    onSaved(saved);
  };

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: mutate(tokenCategoryApi.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: handleSaved,
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenCategoryApi.update, {
      pathParams: { facility_id: facilityId, id: tokenCategory?.id ?? "" },
    }),
    onSuccess: handleSaved,
  });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEdit) {
      update(data);
    } else {
      create({ ...data, resource_type: resourceType });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
        data-cy="token-category-form"
      >
        <SheetBody>
          <FieldSet disabled={isPending} className="gap-0">
            <Frame>
              <FramePanel>
                <FieldGroup>
                  <Field data-cy="token-category-resource-type">
                    <FieldContent>
                      <FieldTitle>{t("resource_type")}</FieldTitle>
                      <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 px-3 py-2 text-sm font-medium">
                        <ResourceIcon className="size-4 text-muted-foreground" />
                        <span className="flex-1">{t(resourceType)}</span>
                        <LockKeyhole
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                      <FieldDescription>
                        {t(
                          isEdit
                            ? "token_category_resource_type_immutable"
                            : "token_category_resource_type_fixed_on_create",
                        )}
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("name")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("enter_token_category_name")}
                            autoFocus
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
                          <Input
                            placeholder={t("enter_shorthand")}
                            maxLength={SHORTHAND_MAX_LENGTH}
                            autoCapitalize="characters"
                            className="font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {shorthand.trim()
                            ? t("token_category_shorthand_preview", {
                                token: tokenNumberPreview(shorthand),
                              })
                            : t("shorthand_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FieldGroup>
              </FramePanel>
            </Frame>
          </FieldSet>
          {tokenCategory && (
            <TokenCategoryDefaultFrame
              facilityId={facilityId}
              tokenCategory={tokenCategory}
            />
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="size-4" />}
            {t(isEdit ? "save_changes" : "create")}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
