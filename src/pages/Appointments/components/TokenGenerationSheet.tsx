import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { TokenGenerate } from "@/types/tokens/token/token";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApis from "@/types/tokens/tokenCategory/tokenCategoryApi";

interface TokenGenerationSheetProps {
  facilityId: string;
  appointmentId: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function TokenGenerationSheet({
  facilityId,
  appointmentId,
  trigger,
  onSuccess,
}: TokenGenerationSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [note, setNote] = useState("");

  // Fetch token categories
  const { data: tokenCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["token_categories", facilityId],
    queryFn: query(tokenCategoryApis.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: "practitioner",
      },
    }),
    enabled: isOpen && !!facilityId,
  });

  // Set default category when categories are loaded
  useEffect(() => {
    if (tokenCategories?.results && tokenCategories.results.length > 0) {
      const defaultCategory = tokenCategories.results.find(
        (category) => category.default,
      );
      if (defaultCategory) {
        setSelectedCategory(defaultCategory.id);
      }
    }
  }, [tokenCategories]);

  // Generate token mutation
  const { mutate: generateToken, isPending: isGenerating } = useMutation({
    mutationFn: mutate(scheduleApis.appointments.generateToken, {
      pathParams: { facilityId, id: appointmentId },
    }),
    onSuccess: () => {
      toast.success(t("token_generated_successfully"));
      setIsOpen(false);
      setSelectedCategory("");
      setNote("");
      onSuccess?.();
      // Invalidate appointment data to refresh
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
    },
  });

  const handleGenerateToken = () => {
    if (!selectedCategory) {
      toast.error(t("please_fill_all_fields"));
      return;
    }

    const tokenData: TokenGenerate = {
      category: selectedCategory,
      note: note.trim(),
    };

    generateToken(tokenData);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedCategory("");
      setNote("");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("generate_token")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  {t("token_category")} *
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_token_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenCategories?.results?.map(
                      (category: TokenCategoryRead) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                          {category.default && ` (${t("default")})`}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium">
                  {t("note")}
                </Label>
                <Textarea
                  id="note"
                  placeholder={t("enter_token_note")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleGenerateToken}
                  disabled={!selectedCategory || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {t("generating")}
                    </>
                  ) : (
                    t("generate_token")
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
