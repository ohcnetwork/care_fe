import { lazy, useEffect, useReducer, useState } from "react";
import { TestTable } from "./Table";
import { useDispatch } from "react-redux";
import {
  createInvestigation,
  listInvestigationGroups,
  listInvestigations,
  getPatient,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { navigate, useQueryParams } from "raviger";

import { useTranslation } from "react-i18next";
import Page from "../../Common/components/Page";
import AutocompleteMultiSelectFormField from "../../Form/FormFields/AutocompleteMultiselect";
import { Submit } from "../../Common/components/ButtonV2";
import Card from "../../../CAREUI/display/Card";

const Loading = lazy(() => import("../../Common/Loading"));

const initialState = {
  form: {},
};

export interface Group {
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
  groups: Group[];
}
type SearchItem = Group | InvestigationType;
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
  investigations: InvestigationType[]
) => {
  return investigations.filter(
    (i) => i.groups.filter((g) => g.external_id === group_id).length !== 0
  );
};

const findGroup = (group_id: string, groups: Group[]) => {
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
    }
  );

  const dispatch: any = useDispatch();
  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);
  const [state, setState] = useReducer(testFormReducer, initialState);
  const [investigations, setInvestigations] = useState<InvestigationType[]>([]);
  const [investigationGroups, setInvestigationGroups] = useState<Group[]>([]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<
    InvestigationType[]
  >([]);
  const [isLoading, setIsLoading] = useState({
    investigationLoading: false,
    investigationGroupLoading: false,
  });
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState("");
  const [selectedItems, selectItems] = useState<SearchItem[]>([]);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const searchOptions = [...investigationGroups, ...investigations];

  useEffect(() => {
    if (investigations.length > 0) {
      const prefilledGroups = preselectedInvestigations
        .filter((inv: any) => inv.isGroup)
        .map((inv: any) =>
          investigationGroups.find((group) => group.name === inv.name)
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
          const investigation = investigations.find(
            (investigation) => investigation.name === inv.name
          );
          // check if investigation contains all groups
          if (
            inv.groups.every((group: string) =>
              investigation?.groups.find(
                (investigationGroup) => investigationGroup.name === group
              )
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
            investigation?.groups.map((group: any) => group.external_id)
          )
          .flat(),
      ];
      setSelectedGroup(Array.from(new Set(allGroups)));
      selectItems([...prefilledGroups, ...prefilledInvestigations]);
    }
  }, [investigations, investigationGroups]);

  const fetchInvestigations = () => {
    setIsLoading({ ...isLoading, investigationLoading: true });
    dispatch(listInvestigations({})).then((res: any) => {
      if (res && res.data) {
        setInvestigations(res.data.results);
      }
      setIsLoading({ ...isLoading, investigationLoading: false });
    });
  };

  const fetchInvestigationGroups = () => {
    setIsLoading({ ...isLoading, investigationGroupLoading: true });
    dispatch(listInvestigationGroups({})).then((res: any) => {
      if (res && res.data) {
        setInvestigationGroups(res.data.results);
      }
      setIsLoading({ ...isLoading, investigationGroupLoading: false });
    });
  };

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  useEffect(() => {
    fetchInvestigationGroups();
    fetchInvestigations();
    setSession(new Date().toString());
  }, [props.consultationId]);

  const initialiseForm = () => {
    const investigationsArray = selectedGroup.map((group_id: string) => {
      return listOfInvestigations(group_id, investigations);
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
              })
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
          (i) => ![null, undefined, NaN, ""].includes(i.notes || i.value)
        );

      if (data.length) {
        const res = await dispatch(
          createInvestigation({ investigations: data }, props.consultationId)
        );
        if (res && res.status === 204) {
          setSaving(false);
          Notification.Success({
            msg: "Investigation created successfully!",
          });
          navigate(
            `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`
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

  if (isLoading.investigationGroupLoading || isLoading.investigationLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={t("log_lab_results")}
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
    >
      <div className="flex flex-col gap-2">
        <AutocompleteMultiSelectFormField
          className="mt-5"
          name="investigations"
          placeholder="Search Investigations & Groups"
          options={searchOptions}
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
                        : []
                    ),
                  []
                ),
              ].filter((v, i, a) => a.indexOf(v) == i)
            );
          }}
        />

        {selectedGroup.map((group_id) => {
          const currentGroupsInvestigations = selectedInvestigations.filter(
            (e) => e.groups.map((e) => e.external_id).includes(group_id)
          );
          const filteredInvestigations = currentGroupsInvestigations.length
            ? currentGroupsInvestigations
            : listOfInvestigations(group_id, investigations);
          const group = findGroup(group_id, investigationGroups);
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
            label="Save Investigation"
          />
        </div>
      </div>
    </Page>
  );
};

export default Investigation;
