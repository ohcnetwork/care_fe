import React, {useEffect, useReducer, useState} from "react";
import {MultiSelectField} from "../../Common/HelperInputFields";
import {TestTable} from "./Table";
import {useDispatch} from "react-redux";
import {createInvestigation, listInvestigationGroups, listInvestigations,} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import {navigate} from "raviger";
import loadable from "@loadable/component";

const Loading = loadable(() => import("../../Common/Loading"));
const PageTitle = loadable(() => import("../../Common/PageTitle"));

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
  groups: [Group];
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

let listOfInvestigations = (
  group_id: string,
  investigations: InvestigationType[]
) => {
  return investigations.filter(
    (i) => i.groups.filter((g) => g.external_id === group_id).length !== 0
  );
};

let findGroup = (group_id: string, groups: Group[]) => {
  return groups.find((g) => g.external_id === group_id);
};

const Investigation = (props: {
  consultationId: string;
  patientId: string;
  facilityId: string;
}) => {
  const dispatch: any = useDispatch();
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [state, setState] = useReducer(testFormReducer, initialState);
  const [investigations, setInvestigations] = useState<InvestigationType[]>([]);
  const [investigationGroups, setInvestigationGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState({
    investigationLoading: false,
    investigationGroupLoading: false,
  });
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState("");

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
    fetchInvestigationGroups();
    fetchInvestigations();
    setSession(new Date().toString());
  }, [props.consultationId]);

  const handleGroupSelect = (e: any, child?: any) => {
    const { value } = e?.target;

    let investigationsArray = value.map((group_id: string) => {
      return listOfInvestigations(group_id, investigations);
    });

    let flatInvestigations = investigationsArray.flat();
    let form: any = {};

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

    setSelectedGroup(value);
    setState({ type: "set_form", form });
  };

  const handleSubmit = async (e: any) => {
    if (!saving || state.form !== {}) {
      setSaving(true);

      const keys = Object.keys(state.form);
      const data = keys.map((k) => {
        return {
          investigation: k,
          value: state.form[k]?.value,
          notes: state.form[k]?.notes,
          session: session,
        };
      });

      const res = await dispatch(
        createInvestigation({ investigations: data }, props.consultationId)
      );

      if (res && res.status === 201 && res.data) {
        setSaving(false);
        Notification.Success({
          msg: "Investigation created successfully!",
        });
        navigate(
          `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}/`
        );
      } else {
        setSaving(false);
      }
    }
  };

  if (isLoading.investigationGroupLoading || isLoading.investigationLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PageTitle title={"Create Investigation"} />
      <div className="mt-5">
        <label className="text-sm" id="investigation-group-label">
          Select Investigation Groups
        </label>
        <MultiSelectField
          id="investigation-group-label"
          options={investigationGroups}
          value={selectedGroup}
          optionValue="name"
          optionKey="external_id"
          onChange={handleGroupSelect}
        />
      </div>
      {selectedGroup.map((group_id: string) => {
        const filteredInvestigations = listOfInvestigations(
          group_id,
          investigations
        );
        const group = findGroup(group_id, investigationGroups);
        return (
          <TestTable
            data={filteredInvestigations}
            title={group?.name}
            key={group_id}
            state={state.form}
            dispatch={setState}
          />
        );
      })}
      <button
        className="btn btn-primary mt-4"
        onClick={handleSubmit}
        disabled={saving || state.form === {}}
      >
        Save Investigation
      </button>
    </div>
  );
};

export default Investigation;
