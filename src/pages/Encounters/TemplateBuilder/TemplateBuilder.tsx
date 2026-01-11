import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ContextSchema,
  FieldSchema,
  TemplateFormat,
  TemplateFormats,
  TemplateRead,
  TemplateStatus,
  TemplateStatuses,
  TemplateTypes,
} from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";

import queryClient from "@/Utils/request/queryClient";
import { generateSlug } from "@/Utils/utils";
import BackButton from "@/components/Common/BackButton";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import DOMPurify from "dompurify";
import { t } from "i18next";
import { navigate } from "raviger";
import { toast } from "sonner";
import { z } from "zod";
import {
  DEFAULT_TEMPLATE,
  generateNestedQuerysetInsertion,
  generateSingleObjectInsertion,
  insertAtCursor,
} from "./templateUtils";

const templateBuilderSchema = z.object({
  name: z.string().min(1),
  slug_value: z
    .string()
    .trim()
    .min(5, {
      message: t("character_count_validation", { min: 5, max: 25 }),
    })
    .max(25, {
      message: t("character_count_validation", { min: 5, max: 25 }),
    })
    .regex(/^[a-z0-9-]+$/, {
      message: t("slug_format_message"),
    }),
  status: z.enum(TemplateStatuses),
  template_type: z.enum(TemplateTypes),
  default_format: z.enum(TemplateFormats),
  context: z.string().min(1),
  description: z.string().optional(),
  template_data: z.string().min(1),
});

export default function TemplateBuilder({
  facilityId,
  slug,
}: {
  facilityId: string;
  slug?: string;
}) {
  const isEditing = !!slug;
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedContext, setSelectedContext] = useState<ContextSchema | null>(
    null,
  );
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [previewState, setPreviewState] = useState<{
    isActive: boolean;
    data: Blob | string | null;
    format: TemplateFormat | null;
  }>({ isActive: false, data: null, format: null });

  const form = useForm({
    resolver: zodResolver(templateBuilderSchema),
    defaultValues: {
      name: "",
      slug_value: "",
      status: "draft" as TemplateStatus,
      default_format: "html" as TemplateFormat,
      template_data: DEFAULT_TEMPLATE,
      context: "",
    },
  });

  const { data: schema, isLoading } = useQuery({
    queryKey: ["templateSchema"],
    queryFn: query(templateApi.retrieveSchema),
  });

  const availableContexts = schema?.contexts ?? {};

  const { data: template } = useQuery({
    queryKey: ["template", slug],
    queryFn: query(templateApi.retrieveTemplate, {
      pathParams: { slug: slug ?? "" },
    }),
    enabled: !!slug,
  });

  const { mutate: createTemplate } = useMutation({
    mutationFn: mutate(templateApi.createTemplate),
    onSuccess: (data: TemplateRead) => {
      toast.success(t("template_saved"));
      navigate(`/facility/${facilityId}/template/builder/${data.slug}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateTemplate } = useMutation({
    mutationFn: mutate(templateApi.updateTemplate, {
      pathParams: { slug: template?.slug ?? "" },
    }),
    onSuccess: () => {
      toast.success(t("template_updated"));
      queryClient.invalidateQueries({ queryKey: ["template", template?.slug] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: createTemplatePreview } = useMutation({
    mutationFn: mutate(templateApi.createTemplatePreview),
    onSuccess: (data: Blob | string) => {
      const format = form.getValues("default_format");
      setPreviewState({
        isActive: true,
        data,
        format,
      });
      toast.success(t("template_preview_generated"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (isEditing) return;
    const subscription = form.watch((value, { name }) => {
      if (name === "name") {
        form.setValue("slug_value", generateSlug(value.name || "", 25), {
          shouldValidate: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        slug_value: template.slug_config.slug_value,
        status: template.status,
        default_format: template.default_format,
        template_data: template.template_data,
        context: template.context,
        template_type: template.template_type as (typeof TemplateTypes)[number],
        description: template.description,
      });
    }
  }, [template]);

  useEffect(() => {
    if (template && availableContexts) {
      setSelectedContext(availableContexts[template.context]);
    }
  }, [template, availableContexts]);

  // Handle template save
  const handleSaveTemplate = async () => {
    const formData = form.getValues();
    const templateData = {
      template_type: formData.template_type,
      name: formData.name,
      slug_value: formData.slug_value,
      status: formData.status,
      default_format: formData.default_format,
      template_data: formData.template_data,
      context: selectedContext?.slug ?? "",
      description: formData.description || "",
      facility: facilityId,
    };

    if (template?.id) {
      updateTemplate({
        ...templateData,
      });
    } else {
      createTemplate(templateData);
    }
  };

  // Handle template preview
  const handlePreviewTemplate = async () => {
    const formData = form.getValues();
    const previewData = {
      template_data: formData.template_data,
      context: selectedContext?.slug ?? "",
      output_format: formData.default_format,
    };

    createTemplatePreview(previewData);
  };

  // Get cursor position
  const getCursorPosition = (): number => {
    const text = textareaRef.current?.value || "";
    const textContent = "<!-- Add your content here -->";
    let bodyStart = text.indexOf(textContent);
    bodyStart += textContent.length + "\n".length;
    const selectionStart = textareaRef.current?.selectionStart ?? text.length;
    const cursorPosition =
      selectionStart === text.length ? bodyStart : selectionStart;
    return cursorPosition;
  };

  // Toggle nested field expansion
  const toggleFieldExpansion = (fieldKey: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  // Handle nested field insertion (for fields within a queryset loop)
  const handleFieldClick = (fieldKey: string) => {
    if (!selectedContext) return;

    const fieldKeys = fieldKey.split(".");
    const contextKey = selectedContext.context_key;

    // Traverse the fields and collect ALL queryset ancestors
    // Each queryset needs its own for loop
    let currentField = selectedContext.fields.find(
      (field) => field.key === fieldKeys[0],
    );

    // Traverse the tree to find all ancestors
    const querysetLevels: { index: number; key: string }[] = [];

    for (let i = 0; i < fieldKeys.length - 1; i++) {
      if (!currentField) break;

      if (currentField.nested_context_type === "queryset") {
        querysetLevels.push({ index: i, key: fieldKeys[i] });
      }

      // Move to next level
      if (i < fieldKeys.length - 2) {
        currentField = currentField.fields?.find(
          (field) => field.key === fieldKeys[i + 1],
        );
      }
    }

    const template = form.getValues("template_data");
    const cursorPosition = getCursorPosition();
    let newTemplate: string;
    let newCursorPos: number;

    if (querysetLevels.length > 0) {
      // There are queryset ancestors - need nested for loops
      const result = generateNestedQuerysetInsertion(
        template,
        contextKey,
        fieldKeys,
        querysetLevels,
        cursorPosition,
      );
      newTemplate = result.newTemplate;
      newCursorPos = result.cursorPosition;
    } else {
      const insertion = generateSingleObjectInsertion(contextKey, fieldKey);
      const result = insertAtCursor(template, insertion, cursorPosition);
      newTemplate = result.newTemplate;
      newCursorPos = result.cursorPosition;
    }

    form.setValue("template_data", newTemplate);

    // Set cursor position after React renders
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BackButton
              size="icon"
              to={`/facility/${facilityId}/template`}
              aria-label={t("back")}
            >
              <ChevronLeft />
            </BackButton>
            <div>
              <h1 className="text-2xl font-bold">{t("template_builder")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("template_builder_description")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() =>
                setPreviewState({ isActive: false, data: null, format: null })
              }
              disabled={!previewState.isActive}
            >
              {t("clear_preview")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviewTemplate}
              disabled={previewState.isActive}
            >
              {t("preview_template")}
            </Button>
            <Button type="button" onClick={handleSaveTemplate}>
              {t("save_template")}
            </Button>
          </div>
        </div>

        {/* Template metadata fields */}
        <Form {...form}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("template_name")}
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("enter_template_name")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("slug")}
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("enter_slug")}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("status")}
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TemplateStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("default_format")}
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_format")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TemplateFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("report_type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_report_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TemplateTypes.map((reportType) => (
                        <SelectItem key={reportType} value={reportType}>
                          {t(reportType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Main Editor - 3/4 of screen */}
        <div className="flex-2! p-4 overflow-auto">
          {previewState.isActive ? (
            <PreviewContent
              previewData={previewState.data}
              format={previewState.format}
            />
          ) : (
            <TemplateEditor form={form} textareaRef={textareaRef} />
          )}
        </div>

        {/* Sidebar - 1/4 of screen */}
        <div className="flex-1 border-l p-4 overflow-auto flex flex-col gap-4">
          {/* Context Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("select_context")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedContext?.slug}
                onValueChange={(value) =>
                  setSelectedContext(availableContexts[value])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_context")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(availableContexts).map((context) => (
                    <SelectItem key={context.slug} value={context.slug}>
                      {context.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContext?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedContext.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fields List */}
          {selectedContext && (
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{t("fields")}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-1">
                    {selectedContext.fields.map((field) => (
                      <FieldItem
                        key={field.key}
                        field={field}
                        expandedFields={expandedFields}
                        toggleFieldExpansion={toggleFieldExpansion}
                        onClick={handleFieldClick}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {!selectedContext && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-4">
              <p>{t("select_context_to_view_fields")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldItem({
  field,
  expandedFields,
  toggleFieldExpansion,
  onClick,
  depth = 0,
  parentPath = "",
}: {
  field: FieldSchema;
  expandedFields: Set<string>;
  toggleFieldExpansion: (fieldKey: string) => void;
  onClick: (fieldKey: string) => void;
  depth?: number;
  parentPath?: string;
}) {
  const isNested = field.is_nested_context;
  const isExpanded = expandedFields.has(field.key);
  const currentPath = parentPath ? `${parentPath}.${field.key}` : field.key;

  if (isNested && field.fields) {
    return (
      <Collapsible
        key={field.key}
        open={isExpanded}
        onOpenChange={() => toggleFieldExpansion(field.key)}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto py-2"
            style={{ paddingLeft: `${depth * 1.5}rem` }}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 mr-2 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            <div className="flex flex-col items-start flex-1">
              <span className="font-medium text-sm">{field.display}</span>
              {field.description && (
                <span className="text-xs text-muted-foreground font-normal">
                  {field.description}
                </span>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-1">
          {field.fields.map((nestedField) => (
            <FieldItem
              key={nestedField.key}
              field={nestedField}
              expandedFields={expandedFields}
              toggleFieldExpansion={toggleFieldExpansion}
              onClick={onClick}
              depth={depth + 1}
              parentPath={currentPath}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Simple field
  return (
    <Button
      key={field.key}
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onClick(currentPath)}
      className="w-full justify-start text-left h-auto py-2"
      style={{ paddingLeft: `${depth * 1.5 + 1.5}rem` }}
    >
      <div className="flex flex-col items-start flex-1">
        <span className="font-medium text-sm">{field.display}</span>
        {field.description && (
          <span className="text-xs text-muted-foreground font-normal">
            {field.description}
          </span>
        )}
      </div>
    </Button>
  );
}

function TemplateEditor({
  form,
  textareaRef,
}: {
  form: UseFormReturn<z.infer<typeof templateBuilderSchema>>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const { t } = useTranslation();
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="template_data"
        render={({ field: { ...field } }) => (
          <FormItem className="h-full flex flex-col">
            <FormLabel>{t("template_html")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                ref={textareaRef}
                className="flex-1 font-mono text-sm resize-none"
                placeholder={t("enter_template_html")}
                spellCheck={false}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}

function PreviewContent({
  previewData,
  format,
}: {
  previewData: Blob | string | null;
  format: TemplateFormat | null;
}) {
  const { t } = useTranslation();

  const [contentState, setContentState] = useState<{
    html: string | null;
    pdf: string | null;
  }>({ html: null, pdf: null });

  useEffect(() => {
    if (!previewData || !format) return;

    if (format === "html") {
      setContentState({ html: previewData as string, pdf: null });
    } else if (format === "pdf") {
      const url = URL.createObjectURL(previewData as Blob);
      setContentState({ html: null, pdf: url });

      return () => URL.revokeObjectURL(url);
    }
  }, [previewData, format]);

  // Callback ref for HTML preview with Shadow DOM
  const shadowHostCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !contentState.html) return;

      // Create shadow root if it doesn't exist
      let shadowRoot = node.shadowRoot;
      if (!shadowRoot) {
        shadowRoot = node.attachShadow({ mode: "open" });
      }

      // Sanitize the HTML (keeps styles but removes scripts and dangerous attributes)
      const sanitizedHtml = DOMPurify.sanitize(contentState.html, {
        WHOLE_DOCUMENT: true,
        ALLOWED_TAGS: [
          "html",
          "head",
          "body",
          "style",
          "title",
          "meta",
          "link",
          "div",
          "span",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "strong",
          "em",
          "b",
          "i",
          "u",
          "br",
          "hr",
          "a",
          "img",
        ],
        ALLOWED_ATTR: [
          "class",
          "id",
          "style",
          "href",
          "src",
          "alt",
          "title",
          "width",
          "height",
          "colspan",
          "rowspan",
          "charset",
        ],
        ALLOW_DATA_ATTR: false,
      });

      shadowRoot.innerHTML = sanitizedHtml;
    },
    [contentState.html],
  );

  if (!previewData) return null;

  return (
    <div className="h-full flex flex-col">
      <p className="mb-2 font-medium">{t("preview_template")}</p>
      {format === "html" && contentState.html && (
        <div
          ref={shadowHostCallback}
          className="flex-1 border rounded-md p-4 bg-white overflow-auto min-h-[400px]"
        />
      )}
      {format === "pdf" && contentState.pdf && (
        <iframe
          src={contentState.pdf}
          className="flex-1 border rounded-md bg-white min-h-[400px] w-full"
          title={t("preview_template")}
        />
      )}
    </div>
  );
}
