import { navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import LogUpdateSections, {
  RoundTypeSections,
} from "@/components/LogUpdate/Sections";
import { DailyRoundsModel } from "@/components/Patient/models";

import { useSlugs } from "@/hooks/useSlug";

import { Success } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

type Props = {
  facilityId: string;
  patientId: string;
  consultationId: string;
  id: string;
};

type SectionKey = keyof typeof LogUpdateSections;

export default function CriticalCareEditor(props: Props) {
  const { t } = useTranslation();

  const query = useQuery(routes.getDailyReport, {
    pathParams: { consultationId: props.consultationId, id: props.id },
  });

  const [completed, setCompleted] = useState<SectionKey[]>([]);
  const [current, setCurrent] = useState<SectionKey>();

  if (query.loading || !query.data) {
    return <Loading />;
  }

  const roundType = query.data.rounds_type ?? "VENTILATOR";

  const sections = RoundTypeSections[roundType];
  const consultationDashboardUrl = `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`;

  return (
    <div
      className={classNames(
        "w-full transition-all duration-200 ease-in-out md:mx-auto md:pt-8",
        current ? "md:max-w-5xl" : "md:max-w-2xl",
      )}
    >
      <div className="py-4">
        <ButtonV2
          id="back-to-consultation"
          variant="secondary"
          onClick={() => {
            if (current) {
              setCurrent(undefined);
            } else {
              navigate(consultationDashboardUrl);
            }
          }}
        >
          {t(current ? "back" : "back_to_consultation")}
        </ButtonV2>
      </div>
      <Card className="shadow-lg md:rounded-xl lg:p-8">
        <h3 className="mb-6 text-black">
          {current
            ? LogUpdateSections[current].meta.title
            : t("record_updates")}
        </h3>
        {current ? (
          <SectionEditor
            section={current}
            log={query.data}
            onComplete={() => {
              if (!completed.find((o) => o === current)) {
                setCompleted((c) => [...c, current]);
              }
              setCurrent(undefined);
              query.refetch();
            }}
          />
        ) : (
          <ul className="space-y-4 bg-white">
            <li>
              <ButtonV2
                ghost
                className="w-full bg-primary-100/50 py-3"
                border
                href={`${consultationDashboardUrl}/daily-rounds/${props.id}/update`}
              >
                <CareIcon
                  icon="l-info-circle"
                  className="mr-2 text-2xl text-primary-500"
                />
                <span className="mr-auto text-lg font-semibold">
                  Basic Editor
                </span>
                <CareIcon icon="l-check-circle" className="text-2xl" />
              </ButtonV2>
            </li>
            {sections.map((key) => {
              const isCompleted = completed.includes(key as SectionKey);
              const section = LogUpdateSections[key as SectionKey];

              return (
                <li key={key}>
                  <ButtonV2
                    ghost
                    variant={isCompleted ? "primary" : "secondary"}
                    className={classNames(
                      "w-full py-3",
                      isCompleted && "bg-primary-100/50",
                    )}
                    border
                    onClick={() => setCurrent(key as SectionKey)}
                  >
                    {section.meta.icon && (
                      <CareIcon
                        icon={section.meta.icon}
                        className={classNames(
                          "mr-2 text-2xl",
                          isCompleted
                            ? "text-primary-500"
                            : "text-secondary-500",
                        )}
                      />
                    )}
                    <span className="mr-auto text-lg font-semibold">
                      {section.meta.title}
                    </span>
                    <CareIcon
                      icon="l-check-circle"
                      className={classNames(
                        "text-2xl",
                        !isCompleted && "text-secondary-500",
                      )}
                    />
                  </ButtonV2>
                </li>
              );
            })}
          </ul>
        )}

        {!current && (
          <Submit
            label="Complete"
            className="mt-8 md:w-full"
            onClick={() => {
              if (roundType === "VENTILATOR") {
                Success({ msg: "Detailed Log Update filed successfully" });
              } else if (roundType === "DOCTORS_LOG") {
                Success({ msg: "Progress Note Log Update filed successfully" });
              }

              navigate(consultationDashboardUrl);
            }}
          />
        )}
      </Card>
    </div>
  );
}

type SectionEditorProps = {
  log: DailyRoundsModel;
  onComplete: () => void;
  section: SectionKey;
};

const SectionEditor = ({ log, onComplete, section }: SectionEditorProps) => {
  const [consultationId, id] = useSlugs("consultation", "daily_rounds");
  const [diff, setDiff] = useState<Partial<DailyRoundsModel>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const Section = LogUpdateSections[section];

  return (
    <div
      className={classNames(isProcessing && "pointer-events-none opacity-50")}
    >
      <Section
        log={{ ...log, ...diff }}
        onChange={(changes) => setDiff((base) => ({ ...base, ...changes }))}
      />
      <Submit
        className="mt-8 md:w-full"
        disabled={isProcessing || !Object.keys(diff).length}
        label="Update Details"
        onClick={async () => {
          setIsProcessing(true);
          const { res } = await request(routes.updateDailyRound, {
            pathParams: { consultationId, id },
            body: diff,
          });
          setIsProcessing(false);
          if (res?.ok) {
            onComplete();
            Success({
              msg: `${Section.meta.title} details succesfully updated.`,
            });
          }
        }}
      />
    </div>
  );
};
