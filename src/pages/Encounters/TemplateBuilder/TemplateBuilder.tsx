import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ContextConfig,
  TemplateFormat,
  TemplateFormats,
  TemplatePreviewRead,
  TemplateRead,
  TemplateStatus,
  TemplateStatuses,
  TemplateTypes,
} from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";

import { generateSlug } from "@/Utils/utils";
import { cn } from "@/lib/utils";
import reportApi from "@/types/emr/report/reportApi";
import { zodResolver } from "@hookform/resolvers/zod";
import DOMPurify from "dompurify";
import { t } from "i18next";
import { navigate } from "raviger";
import { toast } from "sonner";
import { z } from "zod";
import {
  DEFAULT_CONTEXT_CONFIG,
  DEFAULT_TEMPLATE,
  generateQuerysetInsertion,
  generateSingleObjectInsertion,
  insertAtCursor,
  isSectionUsed,
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
  context_config: z.record(
    z.string(),
    z
      .object({
        filters: z.record(z.string(), z.string()).optional(),
        limit: z.number().nullable().optional(),
      })
      .optional(),
  ),
  template_data: z.string().min(1),
});
export default function TemplateBuilder({
  facilityId,
  slug,
}: {
  facilityId: string;
  slug?: string;
}) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [activeTabs, setActiveTabs] = useState<string[]>(
    Object.keys(DEFAULT_CONTEXT_CONFIG),
  );
  const [currentTab, setCurrentTab] = useState<string>(
    Object.keys(DEFAULT_CONTEXT_CONFIG)[0] || "",
  );
  const [previewState, setPreviewState] = useState<{
    isActive: boolean;
    data: TemplatePreviewRead | null;
  }>({ isActive: false, data: null });

  const form = useForm({
    resolver: zodResolver(templateBuilderSchema),
    defaultValues: {
      name: "",
      slug_value: "",
      status: "draft" as TemplateStatus,
      default_format: "html" as TemplateFormat,
      template_data: DEFAULT_TEMPLATE,
      context_config: DEFAULT_CONTEXT_CONFIG,
    },
  });

  const { data: schema, isLoading } = useQuery({
    queryKey: ["templateSchema"],
    queryFn: query(templateApi.retrieveSchema),
  });

  const { data: reportTypes } = useQuery({
    queryKey: ["reportTypes"],
    queryFn: query(reportApi.getReportTypes),
  });

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
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: createTemplatePreview } = useMutation({
    mutationFn: mutate(templateApi.createTemplatePreview),
    onSuccess: (data: TemplatePreviewRead) => {
      setPreviewState({ isActive: true, data });
      toast.success(t("template_preview_generated"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name") {
        form.setValue("slug_value", generateSlug(value.name || "", 25), {
          shouldValidate: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (template) {
      form.reset({
        ...template,
        slug_value: template.slug_config.slug_value,
      });
    }
  }, [template]);

  // Handle template save
  const handleSaveTemplate = async () => {
    const formData = form.getValues();
    const templateData = {
      template_type: template?.template_type || "discharge_summary",
      name: formData.name,
      slug_value: formData.slug_value,
      status: formData.status,
      default_format: formData.default_format,
      template_data: formData.template_data,
      context_config: formData.context_config as Record<string, ContextConfig>,
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
      context_config: formData.context_config as Record<string, ContextConfig>,
      output_format: formData.default_format,
      options: {},
    };

    createTemplatePreview(previewData);
  };

  // Get cursor position
  const getCursorPosition = (): number => {
    const text = textareaRef.current?.value || "";
    const textContent = "<!-- Add your content here -->";
    let bodyStart = text.indexOf(textContent);
    if (bodyStart !== -1) {
      bodyStart += textContent.length;
    }
    return textareaRef.current?.selectionStart || bodyStart;
  };

  // Add a new tab for a section
  const addTab = (sectionKey: string) => {
    if (!activeTabs.includes(sectionKey)) {
      setActiveTabs([...activeTabs, sectionKey]);
      setCurrentTab(sectionKey);
    } else {
      setCurrentTab(sectionKey);
    }
    setSelectedSection("");
  };

  // Remove a tab
  const removeTab = (sectionKey: string) => {
    const newTabs = activeTabs.filter((tab) => tab !== sectionKey);
    setActiveTabs(newTabs);

    // Switch to another tab if the removed one was active
    if (currentTab === sectionKey && newTabs.length > 0) {
      setCurrentTab(newTabs[0]);
    }

    // Remove from context_config if no fields are left or section not used in template
    const template = form.getValues("template_data");
    if (!isSectionUsed(template, sectionKey)) {
      const contextConfig = form.getValues("context_config");
      const { [sectionKey]: _removed, ...rest } = contextConfig || {};
      form.setValue("context_config", rest);
    }
  };

  // Add field to context_config
  const addFieldToContextConfig = (sectionKey: string) => {
    let contextConfig = form.getValues("context_config");

    if (!contextConfig) {
      contextConfig = {};
    }

    if (!contextConfig?.[sectionKey]) {
      contextConfig[sectionKey] = {};
    }
  };

  // Handle field button click for single objects
  const handleSingleItemSectionClick = (
    sectionKey: string,
    fieldKey: string,
  ) => {
    const template = form.getValues("template_data");
    const cursorPosition = getCursorPosition();
    const insertion = generateSingleObjectInsertion(sectionKey, fieldKey);

    const { newTemplate, cursorPosition: newCursorPos } = insertAtCursor(
      template,
      insertion,
      cursorPosition,
    );

    form.setValue("template_data", newTemplate);
    addFieldToContextConfig(sectionKey);

    // Set cursor position after React renders
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle field button click for querysets
  const handleMultiItemSectionClick = (
    sectionKey: string,
    fieldKey: string,
  ) => {
    const template = form.getValues("template_data");
    const cursorPosition = getCursorPosition();

    const { newTemplate, cursorPosition: newCursorPos } =
      generateQuerysetInsertion(template, sectionKey, fieldKey, cursorPosition);

    form.setValue("template_data", newTemplate);
    addFieldToContextConfig(sectionKey);

    // Set cursor position after React renders
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Get section schema
  const getSectionSchema = (sectionKey: string) => {
    if (!schema) return null;
    return (
      schema.single_objects?.[sectionKey] || schema.querysets?.[sectionKey]
    );
  };

  // Check if section is a queryset
  const isMultiItemSection = (sectionKey: string) => {
    return schema?.querysets?.[sectionKey] !== undefined;
  };

  // Get available sections (not yet added as tabs)
  const availableSections = schema
    ? [
        ...Object.keys(schema.single_objects || {}),
        ...Object.keys(schema.querysets || {}),
      ].filter((key) => !activeTabs.includes(key))
    : [];

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
          <div>
            <h1 className="text-2xl font-bold">{t("template_builder")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("template_builder_description")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setPreviewState({ isActive: false, data: null })}
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                    <Input {...field} placeholder={t("enter_slug")} />
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
                      {Object.entries(reportTypes || {})?.map(
                        ([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.display_name}
                          </SelectItem>
                        ),
                      )}
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
            <PreviewContent previewData={previewState.data} />
          ) : (
            <TemplateEditor form={form} textareaRef={textareaRef} />
          )}
        </div>

        {/* Sidebar - 1/4 of screen */}
        <div className="flex-1 border-l p-4 overflow-auto flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("add_section")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("select_section")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((sectionKey) => {
                      const sectionSchema = getSectionSchema(sectionKey);
                      return (
                        <SelectItem key={sectionKey} value={sectionKey}>
                          {sectionSchema?.display || sectionKey}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => selectedSection && addTab(selectedSection)}
                  disabled={!selectedSection}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section selectors and fields */}
          {activeTabs.length > 0 && (
            <Card className="flex-1 flex flex-col overflow-auto">
              <CardHeader>
                <CardTitle className="text-lg">{t("fields")}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1">
                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex flex-row flex-wrap gap-2">
                      {activeTabs.map((tabKey) => {
                        const sectionSchema = getSectionSchema(tabKey);
                        const isActive = currentTab === tabKey;

                        return (
                          <Button
                            key={tabKey}
                            type="button"
                            variant={isActive ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => setCurrentTab(tabKey)}
                            className={cn("gap-2 pr-2")}
                          >
                            <span className="font-medium">
                              {sectionSchema?.display || tabKey}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTab(tabKey);
                              }}
                              className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Button>
                        );
                      })}
                    </div>

                    {activeTabs.map((tabKey) => {
                      const sectionSchema = getSectionSchema(tabKey);
                      const isMultiItem = isMultiItemSection(tabKey);
                      const isActive = currentTab === tabKey;
                      return (
                        <div
                          key={tabKey}
                          className="flex flex-row gap-2 bg-white"
                        >
                          {isActive && (
                            <div className="pl-4 space-y-2">
                              {sectionSchema?.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {sectionSchema.description}
                                </p>
                              )}
                              <div className="space-y-1">
                                {sectionSchema?.fields.map((field) => (
                                  <Button
                                    key={field.key}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      isMultiItem
                                        ? handleMultiItemSectionClick(
                                            tabKey,
                                            field.key,
                                          )
                                        : handleSingleItemSectionClick(
                                            tabKey,
                                            field.key,
                                          )
                                    }
                                    className="w-full justify-start text-left h-auto py-2"
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium text-sm">
                                        {field.display}
                                      </span>
                                      {field.description && (
                                        <span className="text-xs text-muted-foreground font-normal">
                                          {field.description}
                                        </span>
                                      )}
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {activeTabs.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-4">
              <p>{t("no_sections_selected")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
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
}: {
  previewData: TemplatePreviewRead | null;
}) {
  const { t } = useTranslation();

  // Callback ref - called when element mounts/unmounts
  const shadowHostCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !previewData?.html) return;

      // Create shadow root if it doesn't exist
      let shadowRoot = node.shadowRoot;
      if (!shadowRoot) {
        shadowRoot = node.attachShadow({ mode: "open" });
      }

      // Sanitize the HTML (keeps styles but removes scripts and dangerous attributes)
      const sanitizedHtml = DOMPurify.sanitize(previewData.html, {
        WHOLE_DOCUMENT: true, // Important: Preserve full document structure
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

      // Set the sanitized HTML into shadow DOM
      shadowRoot.innerHTML = sanitizedHtml;
    },
    [previewData?.html],
  );

  if (!previewData) return null;

  return (
    <div>
      <p>{t("preview_template")}</p>
      <div
        ref={shadowHostCallback}
        className="border rounded-md p-4 bg-white overflow-auto min-h-[400px]"
      />
    </div>
  );
}
