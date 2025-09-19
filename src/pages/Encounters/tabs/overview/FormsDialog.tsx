import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import useQuestionnaireOptions from "@/hooks/useQuestionnaireOptions";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const FormDialog = ({
  trigger,
  subjectType,
  questionnaireTag,
}: {
  trigger: React.ReactNode;
  subjectType: string;
  questionnaireTag: string;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["questionnaires", search, subjectType],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        limit: 15,
        title: search,
        status: "active",
        subject_type: subjectType,
      },
    }),
  });

  const questionnaireOptions = useQuestionnaireOptions(questionnaireTag);
  const quesionnaires = [
    ...questionnaireOptions.results,
    ...(response?.results ?? []),
  ];

  const questionnaireIds = new Set([...quesionnaires.map((q) => q.id)]);

  const questionnaireList = [...questionnaireIds].map(
    (id) => quesionnaires.find((q) => q.id === id)!,
  );

  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <CommandDialog
        className="md:max-w-2xl"
        open={open}
        onOpenChange={setOpen}
      >
        <div className="border-b border-gray-100 shadow-xs">
          <CommandInput
            placeholder={t("search_forms")}
            className="border-none focus:ring-0"
            value={search}
            onValueChange={setSearch}
          />
        </div>
        <CommandList className="h-[80vh] max-h-[80vh] w-full">
          {isLoading ? (
            <CardListSkeleton count={10} />
          ) : questionnaireList.length === 0 ? (
            <CommandEmpty>{t("no_results")}</CommandEmpty>
          ) : (
            questionnaireList.map((questionnaire) => (
              <div key={questionnaire.id}>
                <CommandGroup className="px-2">
                  <Link
                    href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaire.slug}`}
                  >
                    <CommandItem
                      key={questionnaire.slug}
                      value={questionnaire.slug}
                      className="rounded-md cursor-pointer hover:bg-gray-100 flex justify-between aria-selected:bg-gray-100"
                      autoFocus={false}
                    >
                      <span className="flex-1">{questionnaire.title}</span>
                    </CommandItem>
                  </Link>
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
