import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import {
  ValueSetRead,
  ValueSetScope,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";

import query from "@/Utils/request/query";

import { SLUG_MAX, SLUG_MIN, type ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetEditorFormOptions {
  scope: ValueSetScope;
  initialData?: ValueSetRead;
  initialParent?: ValueSetRead;
}

/** Owns the editor's defaults, validation and shared-identifier snapshot. */
export function useValueSetEditorForm({
  scope,
  initialData,
  initialParent,
}: ValueSetEditorFormOptions) {
  const { t } = useTranslation();
  const showBasedOn = !initialData && scope.authContext === "facility";
  const {
    data: sharedCatalogue,
    isSuccess: isSharedCatalogueSuccess,
    isFetching: isSharedCatalogueFetching,
    isError: isSharedCatalogueError,
    refetch: refetchSharedCatalogue,
  } = useQuery({
    queryKey: ["valuesets", "shared-slug-identifiers"],
    queryFn: query.paginated(valueSetApi.list, {
      // Resolution includes all statuses. Fetch every page so a separate
      // facility set cannot accidentally shadow an unseen shared identifier.
      queryParams: { auth_context: "instance" },
      pageSize: 100,
      silent: true,
    }),
    enabled: showBasedOn,
  });
  const sharedSlugs = useMemo(
    () => new Set(sharedCatalogue?.results.map((valueSet) => valueSet.slug)),
    [sharedCatalogue],
  );
  const isSharedCatalogueReady =
    isSharedCatalogueSuccess && !isSharedCatalogueFetching;
  const showSharedCatalogueError =
    isSharedCatalogueError && !isSharedCatalogueFetching;

  const conceptSchema = z.object({
    code: z.string().min(1, t("field_required")),
    display: z.string().min(1, t("valueset_verify_before_saving")),
  });
  const filterSchema = z.object({
    property: z.string().min(1, t("field_required")),
    op: z.string().min(1, t("field_required")),
    value: z.string().min(1, t("field_required")),
  });
  const ruleSchema = z
    .object({
      system: z.string(),
      version: z.string(),
      concept: z.array(conceptSchema).optional(),
      filter: z.array(filterSchema).optional(),
    })
    .superRefine((rule, ctx) => {
      if (rule.concept?.length && rule.filter?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["filter", 0, "property"],
          message: t("valueset_rule_mode_hint"),
        });
      }
    });
  const valuesetFormSchema = z
    .object({
      name: z.string().trim().min(1, t("field_required")),
      slug: z.string().trim(),
      description: z.string(),
      status: z.enum([
        ValueSetStatus.ACTIVE,
        ValueSetStatus.DRAFT,
        ValueSetStatus.RETIRED,
        ValueSetStatus.UNKNOWN,
      ]),
      is_system_defined: z.boolean(),
      disable_composition: z.boolean(),
      compose: z.object({
        include: z.array(ruleSchema),
        exclude: z.array(ruleSchema),
      }),
      parent: z.string().optional(),
      inherited: z.boolean(),
    })
    .superRefine((data, ctx) => {
      // These are authoring rules for a NEW slug. They do not apply to a
      // slug the server assigned: an inherited set takes its parent's
      // verbatim, and an existing set keeps its own — several system slugs
      // are longer than SLUG_MAX, and re-validating them here would make
      // those sets impossible to save.
      if (data.inherited || data.slug === initialData?.slug) return;
      if (data.slug.length < SLUG_MIN || data.slug.length > SLUG_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("character_count_validation", {
            min: SLUG_MIN,
            max: SLUG_MAX,
          }),
        });
      } else if (!/^[-\w]+$/.test(data.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("slug_format_message"),
        });
      } else if (showBasedOn && sharedSlugs.has(data.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("valueset_slug_shared_conflict"),
        });
      }
    });

  const form = useForm<ValueSetFormData>({
    resolver: zodResolver(valuesetFormSchema),
    shouldFocusError: false,
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || initialParent?.slug || "",
      description: initialData?.description || "",
      status: initialData?.status || ValueSetStatus.ACTIVE,
      is_system_defined: initialData?.is_system_defined || false,
      disable_composition: initialData?.disable_composition ?? false,
      compose: {
        include:
          initialData?.compose?.include.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
            // Field arrays initialize missing lists as empty. Match that shape
            // in the defaults so opening a saved rule is not itself an edit.
            concept: rule.concept ?? [],
            filter: rule.filter ?? [],
          })) || [],
        exclude:
          initialData?.compose?.exclude.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
            concept: rule.concept ?? [],
            filter: rule.filter ?? [],
          })) || [],
      },
      parent: initialParent?.id,
      // Customize shares the parent's identifier. A separate extension
      // can instead be created with its own identifier.
      inherited: !!initialParent,
    },
  });

  const inherited = useWatch({ control: form.control, name: "inherited" });
  const isSharedSlugCheckBlocked =
    showBasedOn && !inherited && !isSharedCatalogueReady;
  useEffect(() => {
    // A name or slug may be entered before all catalogue pages arrive.
    // Revalidate it against the completed snapshot without another keystroke.
    if (showBasedOn && form.getValues("slug")) {
      void form.trigger("slug");
    }
  }, [form, sharedSlugs, showBasedOn]);
  return {
    form,
    inherited,
    showBasedOn,
    isSharedCatalogueReady,
    isSharedSlugCheckBlocked,
    showSharedCatalogueError,
    refetchSharedCatalogue,
  };
}
