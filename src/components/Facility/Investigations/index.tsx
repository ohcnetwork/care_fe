import { navigate, useQueryParams } from "raviger";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { Submit } from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { TestTable } from "@/components/Facility/Investigations/Table";
import AutocompleteMultiSelectFormField from "@/components/Form/FormFields/AutocompleteMultiselect";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

const initialState = {
  form: {},
};

export interface InvestigationGroup {
  external_id: string;
  name: string;
}

export type InvestigationValueType = "Float" | "Choice" | "String";

export interface InvestigationType {
  investigation_type: InvestigationValueType;
  max_value?: number;
  min_value?: number;
  name: string;
  external_id: string;
  unit?: string;
  choices?: string;
  ideal_value?: string;
  groups: InvestigationGroup[];
}
type SearchItem = InvestigationGroup | InvestigationType;
function isInvestigation(e: SearchItem): e is InvestigationType {
  return (e as InvestigationType).groups !== undefined;
}

const testFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    default:
      return state;
  }
};

const listOfInvestigations = (
  group_id: string,
  investigations: InvestigationType[],
) => {
  return investigations.filter(
    (i) => i.groups.filter((g) => g.external_id === group_id).length !== 0,
  );
};

const findGroup = (group_id: string, groups: InvestigationGroup[]) => {
  return groups.find((g) => g.external_id === group_id);
};

const Investigation = (props: {
  consultationId: string;
  patientId: string;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  const { patientId, facilityId } = props;
  const [{ investigations: queryInvestigationsRaw = undefined }] =
    useQueryParams();
  const queryInvestigations = queryInvestigationsRaw
    ? queryInvestigationsRaw.split("_-_")
    : [];

  const preselectedInvestigations = queryInvestigations.map(
    (investigation: string) => {
      return investigation.includes(" (GROUP)")
        ? {
            isGroup: true,
            name: investigation.replace(" (GROUP)", ""),
          }
        : {
            isGroup: false,
            name: investigation.split(" -- ")[0],
            groups: investigation
              .split(" -- ")[1]
              .split(",")
              .map((group) => group.split("( ")[1].split(" )")[0]),
          };
    },
  );

  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [state, setState] = useReducer(testFormReducer, initialState);
  const [selectedInvestigations, setSelectedInvestigations] = useState<
    InvestigationType[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState("");
  const [selectedItems, selectItems] = useState<SearchItem[]>([]);

  const { data: investigations, loading: listInvestigationDataLoading } =
    useQuery(routes.listInvestigations, {});

  const {
    data: investigationGroups,
    loading: listInvestigationGroupDataLoading,
  } = useQuery(routes.listInvestigationGroups, {});

  const { data: patientData, loading: patientLoading } = useQuery(
    routes.getPatient,
    {
      pathParams: { id: patientId },
      onResponse: (res) => {
        if (res.data) {
          setSession(new Date().toString());
        }
      },
    },
  );

  useEffect(() => {
    if (
      investigations?.results &&
      investigationGroups?.results &&
      investigations?.results.length > 0
    ) {
      const prefilledGroups = preselectedInvestigations
        .filter((inv: any) => inv.isGroup)
        .map((inv: any) =>
          investigationGroups.results.find((group) => group.name === inv.name),
        )
        .map((group: any) => {
          return {
            external_id: group?.external_id || "",
            name: group?.name || "",
          };
        });

      const prefilledInvestigations = preselectedInvestigations
        .filter((inv: any) => !inv.isGroup)
        .map((inv: any) => {
          const investigation = investigations.results.find(
            (investigation) => investigation.name === inv.name,
          );
          // check if investigation contains all groups
          if (
            inv.groups.every((group: string) =>
              investigation?.groups.find(
                (investigationGroup) => investigationGroup.name === group,
              ),
            )
          ) {
            return investigation;
          }
        })
        .filter((investigation: any) => investigation);

      setSelectedInvestigations(prefilledInvestigations);
      const allGroups = [
        ...prefilledGroups.map((group: any) => group?.external_id || ""),
        ...prefilledInvestigations
          .map((investigation: any) =>
            investigation?.groups.map((group: any) => group.external_id),
          )
          .flat(),
      ];
      setSelectedGroup(Array.from(new Set(allGroups)));
      selectItems([...prefilledGroups, ...prefilledInvestigations]);
    }
  }, [investigations, investigationGroups]);

  const initialiseForm = () => {
    const investigationsArray = selectedGroup.map((group_id: string) => {
      return listOfInvestigations(group_id, investigations?.results || []);
    });

    const flatInvestigations = investigationsArray.flat();
    const form: any = {};

    flatInvestigations.forEach(
      (i: InvestigationType) =>
        (form[i.external_id] =
          i.investigation_type === "Float"
            ? {
                value: state.form[i.external_id]?.value,
                investigation_type: i.investigation_type,
              }
            : {
                notes: state.form[i.external_id]?.notes,
                investigation_type: i.investigation_type,
              }),
    );
    setState({ type: "set_form", form });
  };

  const handleSubmit = async (_: any) => {
    initialiseForm();
    if (!saving) {
      setSaving(true);
      const keys = Object.keys(state.form);
      const data = keys
        .map((k) => {
          return {
            investigation: k,
            value: state.form[k]?.value,
            notes: state.form[k]?.notes,
            session: session,
          };
        })
        .filter(
          (i) => ![null, undefined, NaN, ""].includes(i.notes || i.value),
        );

      if (data.length) {
        const { res } = await request(routes.createInvestigation, {
          pathParams: { consultation_external_id: props.consultationId },
          body: {
            investigations: data,
          },
        });
        if (res && res.status === 204) {
          setSaving(false);
          Notification.Success({
            msg: "Investigation created successfully!",
          });
          navigate(
            `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}/investigations`,
          );
        } else {
          setSaving(false);
        }
        return;
      }
      setSaving(false);
      Notification.Error({
        msg: "Please Enter at least one value",
      });
    }
  };

  if (
    listInvestigationDataLoading ||
    listInvestigationGroupDataLoading ||
    patientLoading
  ) {
    return <Loading />;
  }

  return (
    <Page
      title={t("log_lab_results")}
      crumbsReplacements={{
        [facilityId]: { name: patientData?.facility_object?.name },
        [patientId]: { name: patientData?.name },
      }}
    >
      <div className="flex flex-col gap-2">
        <AutocompleteMultiSelectFormField
          className="mt-5"
          name="investigations"
          placeholder={t("search_investigation_placeholder")}
          options={[
            ...(investigationGroups?.results || []),
            ...(investigations?.results || []),
          ]}
          value={selectedItems}
          optionLabel={(option) => option.name}
          optionValue={(option) => option}
          onChange={({ value }) => {
            selectItems(value);
            setSelectedInvestigations(value.filter(isInvestigation));
            setSelectedGroup(
              [
                ...value
                  .filter((e) => !isInvestigation(e))
                  .map((e) => e.external_id),
                ...value.reduce<string[]>(
                  (acc, option) =>
                    acc.concat(
                      isInvestigation(option)
                        ? option.groups.map((e) => e.external_id)
                        : [],
                    ),
                  [],
                ),
              ].filter((v, i, a) => a.indexOf(v) == i),
            );
          }}
        />

        {selectedGroup.map((group_id) => {
          const currentGroupsInvestigations = selectedInvestigations.filter(
            (e) => e.groups.map((e) => e.external_id).includes(group_id),
          );
          const filteredInvestigations = currentGroupsInvestigations.length
            ? currentGroupsInvestigations
            : listOfInvestigations(group_id, investigations?.results || []);
          const group = findGroup(group_id, investigationGroups?.results || []);
          return (
            <Card>
              <TestTable
                data={filteredInvestigations}
                title={group?.name}
                key={group_id}
                state={state.form}
                dispatch={setState}
              />
            </Card>
          );
        })}

        <div className="mt-4 flex justify-end">
          <Submit
            className="w-full md:w-auto"
            onClick={handleSubmit}
            disabled={saving || !selectedGroup.length}
            label={t("save_investigation")}
          />
        </div>
      </div>
    </Page>
  );
};

export default Investigation;
