import RecordMeta from "../../CAREUI/display/RecordMeta";
import useSlug from "../../Common/hooks/useSlug";
import useQuery from "../../Utils/request/useQuery";
import { SymptomText } from "./SymptomsBuilder";
import SymptomsApi from "./api";
import { type EncounterSymptom } from "./types";
import { groupAndSortSymptoms } from "./utils";

// TODO: switch to list from events as timeline view instead once filter event by event type name is done
const EncounterSymptomsCard = () => {
  const consultationId = useSlug("consultation");
  const { data, loading } = useQuery(SymptomsApi.list, {
    pathParams: { consultationId },
    query: { limit: 100 },
  });

  if (!data || loading) {
    return <span>TODO: loader here tooooooo</span>;
  }

  const records = groupAndSortSymptoms(data.results);

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold leading-relaxed text-gray-900">
        Symptoms
      </h3>

      <SymptomsSection title="Active" symptoms={records["in-progress"]} />
      <div className="my-4 w-full border-t-2 border-dashed border-gray-400" />
      <SymptomsSection title="Cured" symptoms={records["completed"]} />
    </div>
  );
};

const SymptomsSection = (props: {
  title: string;
  symptoms: EncounterSymptom[];
}) => {
  return (
    <>
      <h4 className="text-base font-semibold leading-relaxed text-gray-900">
        {props.title}
      </h4>
      <ul className="flex list-disc flex-col px-4">
        {props.symptoms.map((record) => (
          <li key={record.id}>
            <div>
              <SymptomText value={record} />
              <br />
              <span className="flex text-sm text-gray-800">
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
        {!props.symptoms.length && (
          <div className="flex w-full justify-center gap-2 text-center font-medium text-gray-700">
            No symptoms
          </div>
        )}
      </ul>
    </>
  );
};

export default EncounterSymptomsCard;
