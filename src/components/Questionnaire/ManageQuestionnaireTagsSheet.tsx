import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Hash, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";

interface Props {
  form: UseFormReturn<QuestionnaireDetail>;
  trigger?: React.ReactNode;
}

interface TagSelectorProps {
  title?: string;
  selected: QuestionnaireTagModel[];
  onToggle: (tagId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  tagOptions?: QuestionnaireTagModel[];
  className?: string;
  triggerClassName?: string;
}

export function QuestionnaireTagSelector({
  title,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isLoading,
  tagOptions,
  className,
  triggerClassName,
}: TagSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        triggerClassName,
      )}
    >
      <Hash className="mr-2 size-4" />
      <span>{title || t("search_tags")}</span>
    </Button>
  );

  const content = (
    <Command className="rounded-lg" filter={() => 1}>
      <CommandInput
        placeholder={t("search_tags")}
        value={searchQuery}
        onValueChange={onSearchChange}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
      />
      <CommandList>
        <CommandEmpty>{t("no_tags_found")}</CommandEmpty>
        <CommandGroup>
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            tagOptions?.map((tag) => (
              <CommandItem
                key={tag.id}
                value={tag.id}
                onSelect={() => onToggle(tag.id)}
              >
                <div className="flex flex-1 items-center gap-2">
                  <Hash className="size-4" />
                  <span>{tag.name}</span>
                </div>
                {selected.some((t) => t.id === tag.id) && (
                  <Check className="size-4" />
                )}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onSearchChange("");
          }
          setOpen(isOpen);
        }}
      >
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-0 pt-2 max-h-[90vh]">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-2 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover
      modal={true}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onSearchChange("");
        }
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

export default function ManageQuestionnaireTagsSheet({ form, trigger }: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");
  const [selectedTags, setSelectedTags] = useState<QuestionnaireTagModel[]>([]);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: availableTags, isLoading } = useQuery({
    queryKey: ["questionnaireTags", searchQuery],
    queryFn: query.debounced(questionnaireApi.tags.list, {
      queryParams: searchQuery !== "" ? { name: searchQuery } : undefined,
    }),
  });

  const slug = useWatch({ control: form.control, name: "slug" });
  const tags = useWatch({ control: form.control, name: "tags" });

  const { mutate: setTags, isPending: isUpdating } = useMutation({
    mutationFn: mutate(questionnaireApi.setTags, {
      pathParams: { slug: slug },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireDetail", slug],
      });
      toast.success(t("tag_updated_successfully"));
      setOpen(false);
    },
  });

  const { mutate: createTag, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireApi.tags.create),
    onSuccess: (data: unknown) => {
      const tagData = data as QuestionnaireTagModel;
      queryClient.invalidateQueries({
        queryKey: ["questionnaireTags"],
      });
      setSelectedTags((current) => [...current, tagData]);
      setNewTagName("");
      setNewTagSlug("");
      setIsCreateOpen(false);
      toast.success(t("tag_created_successfully"));
    },
  });

  // Initialize selected tags from questionnaire tags
  useEffect(() => {
    if (tags) {
      setSelectedTags(tags);
    }
  }, [tags]);

  // Simple merge of selected tags with available tags
  const tagOptions = useMemo(() => {
    if (!availableTags?.results) return selectedTags;
    if (searchQuery) return availableTags.results;

    const availableIds = new Set(availableTags.results.map((tag) => tag.id));

    // Add selected tags that aren't in availableTags
    const selectedNotInAvailable = selectedTags.filter(
      (selectedTag) => !availableIds.has(selectedTag.id),
    );

    return [...availableTags.results, ...selectedNotInAvailable];
  }, [availableTags, selectedTags, searchQuery]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((current) => {
      const newTag = tagOptions?.find((tag) => tag.id === tagId);
      return current.some((tag) => tag.id === tagId)
        ? current.filter((tag) => tag.id !== tagId)
        : newTag
          ? [...current, newTag]
          : current;
    });
  };

  const handleSave = () => {
    setTags({ tags: selectedTags.map((tag) => tag.slug) });
  };

  const handleCreateTag = () => {
    if (!newTagName.trim() || !newTagSlug.trim()) {
      toast.error(t("name_and_slug_are_required"));
      return;
    }

    createTag({
      name: newTagName.trim(),
      slug: newTagSlug.trim(),
    });
  };

  const hasChanges =
    new Set(tags?.map((tag) => tag.id)).size !== new Set(selectedTags).size ||
    !tags?.every((tag) => selectedTags.some((st) => st.id === tag.id));

  const bodyContent = (
    <div className="space-y-6 py-4">
      {/* Selected Tags */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t("selected_tags")}</h3>
        <div className="flex flex-wrap gap-2">
          {selectedTags?.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.name}
              <Button
                variant="ghost"
                size="icon"
                className="size-4 p-0 hover:bg-transparent"
                onClick={() => handleToggleTag(tag.id)}
                disabled={isUpdating}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))}
          {(!selectedTags || selectedTags.length === 0) && (
            <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
          )}
        </div>
      </div>

      {/* Tag Selector */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t("add_tags")}</h3>
        <QuestionnaireTagSelector
          selected={selectedTags}
          onToggle={handleToggleTag}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoading}
          tagOptions={tagOptions}
          className="w-full justify-start text-left font-normal"
        />
      </div>

      {/* Create New Tag */}
      <Collapsible
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        className="rounded-lg border border-gray-200 p-4"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Plus className="size-4" />
              <span>{t("create_new_tag")}</span>
            </div>
            <CareIcon
              icon={isCreateOpen ? "l-angle-up" : "l-angle-down"}
              className="size-4"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">{t("tag_name")}</Label>
            <Input
              id="tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder={t("enter_tag_name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-slug">{t("tag_slug")}</Label>
            <Input
              id="tag-slug"
              value={newTagSlug}
              onChange={(e) => setNewTagSlug(e.target.value)}
              placeholder={t("enter_tag_slug")}
            />
          </div>
          <Button
            onClick={handleCreateTag}
            disabled={isCreating || !newTagName || !newTagSlug}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("create_tag")
            )}
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const footerActions = (
    <div className="flex w-full justify-end gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSelectedTags(tags);
          setNewTagName("");
          setNewTagSlug("");
          setIsCreateOpen(false);
          setOpen(false);
        }}
      >
        {t("cancel")}
      </Button>
      <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("saving")}
          </>
        ) : (
          t("save")
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Hash className="mr-2 size-4" />
              {t("manage_tags")}
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[60vh] max-h-[85vh] rounded-t-lg">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] px-4 flex flex-col h-full overflow-hidden">
            <div className="mb-2 border-b pb-2">
              <h2 className="text-base font-semibold">{t("manage_tags")}</h2>
              <p className="text-sm text-gray-500">
                {t("manage_tags_description")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">{bodyContent}</div>
            <div className="mt-4 border-t pt-4 sticky bottom-0 bg-white">
              {footerActions}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Hash className="mr-2 size-4" />
            {t("manage_tags")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("manage_tags")}</SheetTitle>
          <SheetDescription>{t("manage_tags_description")}</SheetDescription>
        </SheetHeader>
        {bodyContent}
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {footerActions}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
