import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import LogUpdateSections from "./Sections";
import { useState } from "react";
import Loading from "../Common/Loading";
import { DailyRoundsModel } from "../Patient/models";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Card from "../../CAREUI/display/Card";
import { navigate } from "raviger";
import { classNames } from "../../Utils/utils";
import request from "../../Utils/request/request";
import { useSlugs } from "../../Common/hooks/useSlug";

type Props = {
  facilityId: string;
  patientId: string;
  consultationId: string;
  id: string;
};

type Section = (typeof LogUpdateSections)[keyof typeof LogUpdateSections];

/**
 * This component would be removed in favour of form templates.
 * Just a temporary placeholder for now until form templates are completed.
 */
export default function CriticalCareEditor(props: Props) {
  const query = useQuery(routes.getDailyReport, {
    pathParams: { consultationId: props.consultationId, id: props.id },
  });
  const [completed, setCompleted] = useState<Section[]>([]);
  const [current, setCurrent] = useState<Section>();

  if (query.loading || !query.data) {
    return <Loading />;
  }

  const consultationDashboardUrl = `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`;

  return (
    <div
      className={classNames(
        "transition-all duration-200 ease-in-out md:mx-auto md:pt-8",
        current ? "md:max-w-4xl" : "md:max-w-2xl",
      )}
    >
      <div className="py-4">
        <ButtonV2
          variant="secondary"
          shadow={false}
          onClick={() => {
            if (current) {
              setCurrent(undefined);
            } else {
              navigate(consultationDashboardUrl);
            }
          }}
        >
          {current ? "Back" : "Go back to Consultation"}
        </ButtonV2>
      </div>
      <Card className="lg:p-8">
        <h2>{current?.title ?? "Record Updates"}</h2>
        {current ? (
          <SectionEditor
            section={current}
            log={query.data}
            onCancel={() => setCurrent(undefined)}
            onComplete={() => {
              if (!completed.find((o) => o === current)) {
                setCompleted((c) => [...c, current]);
              }
              setCurrent(undefined);
              query.refetch();
            }}
          />
        ) : (
          <ul className="space-y-4 bg-white py-4">
            {Object.entries(LogUpdateSections).map(([key, section]) => {
              const isCompleted = completed.some((o) => o === section);
              return (
                <li key={key}>
                  <ButtonV2
                    ghost
                    variant={isCompleted ? "primary" : "secondary"}
                    className={classNames(
                      "w-full justify-between",
                      isCompleted && "bg-primary-100/50",
                    )}
                    border
                    onClick={() => setCurrent(section)}
                  >
                    <span className="text-lg font-semibold">
                      {section.title}
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
            className="mt-4 md:w-full"
            href={consultationDashboardUrl}
          />
        )}
      </Card>
    </div>
  );
}

type SectionEditorProps = {
  log: DailyRoundsModel;
  onComplete: () => void;
  onCancel: () => void;
  section: Section;
};

const SectionEditor = ({ section, ...props }: SectionEditorProps) => {
  const [consultationId, id] = useSlugs("consultation", "daily_rounds");
  const [data, setData] = useState<Partial<DailyRoundsModel>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div
      className={classNames(isProcessing && "pointer-events-none opacity-50")}
    >
      <section.component
        log={{ ...props.log, ...data }}
        onChange={(changes) => setData({ ...data, ...changes })}
      />
      <Submit
        className="mt-8 md:w-full"
        disabled={isProcessing}
        label="Update Details"
        onClick={async () => {
          setIsProcessing(true);
          const { res } = await request(routes.updateDailyRound, {
            pathParams: { consultationId, id },
            body: data,
          });
          setIsProcessing(false);
          if (res?.ok) {
            props.onComplete();
          }
        }}
      />
    </div>
  );
};
