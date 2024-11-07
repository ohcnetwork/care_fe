import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { SymptomText } from "@/components/Symptoms/SymptomsBuilder";
import SymptomsApi from "@/components/Symptoms/api";
import { type EncounterSymptom } from "@/components/Symptoms/types";
import { groupAndSortSymptoms } from "@/components/Symptoms/utils";

import useSlug from "@/hooks/useSlug";

import useQuery from "@/Utils/request/useQuery";

// TODO: switch to list from events as timeline view instead once filter event by event type name is done
const EncounterSymptomsCard = () => {
  const consultationId = useSlug("consultation");

  const { data } = useQuery(SymptomsApi.list, {
    pathParams: { consultationId },
    query: { limit: 100 },
  });

  if (!data) {
    return (
      <div className="flex w-full animate-pulse justify-center gap-2 rounded-lg bg-secondary-200 py-8 text-center font-medium text-secondary-700">
        <CareIcon icon="l-spinner-alt" className="animate-spin text-lg" />
        <span>Fetching symptom records...</span>
      </div>
    );
  }

  const records = groupAndSortSymptoms(data.results);

  return (
    <div id="encounter-symptoms">
      <h3 className="mb-2 text-lg font-semibold leading-relaxed text-secondary-900">
        Symptoms
      </h3>

      <div className="grid gap-4 divide-y-2 divide-dashed divide-secondary-400 md:grid-cols-2 md:divide-x-2 md:divide-y-0">
        <SymptomsSection title="Active" symptoms={records["in-progress"]} />
        <div className="pt-4 md:pl-6 md:pt-0">
          <SymptomsSection title="Cured" symptoms={records["completed"]} />
        </div>
      </div>
    </div>
  );
};

const SymptomsSection = (props: {
  title: string;
  symptoms: EncounterSymptom[];
}) => {
  return (
    <div>
      <h4 className="text-base font-semibold leading-relaxed text-secondary-900">
        {props.title}
      </h4>
      <ul className="flex list-disc flex-col px-4">
        {props.symptoms.map((record) => (
          <li key={record.id}>
            <div>
              <SymptomText value={record} />
              <br />
              <span className="flex text-sm text-secondary-800">
                <span className="flex gap-1">
                  Onset <RecordMeta time={record.onset_date} />
                </span>
                {record.cure_date && (
                  <span className="flex gap-1">
                    {"; Cured"} <RecordMeta time={record.cure_date} />
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {!props.symptoms.length && (
        <div className="flex h-full w-full gap-2 font-medium text-secondary-700">
          No symptoms
        </div>
      )}
    </div>
  );
};

export default EncounterSymptomsCard;
