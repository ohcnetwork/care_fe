import React, { useReducer, useState, useEffect } from "react";
import { MultiSelectField } from "../../Common/HelperInputFields";
import { TestTable } from "./Table";
import { useDispatch } from "react-redux";
import {
  listInvestigations,
  listInvestigationGroups,
  createInvestigation,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { navigate } from "raviger";
import loadable from "@loadable/component";
const Loading = loadable(() => import("../../Common/Loading"));
const PageTitle = loadable(() => import("../../Common/PageTitle"));

const initialState = {
  form: {},
};

interface Group {
  external_id: string;
  name: string;
}

type InvestigationValueType = "Float" | "Choice" | "String";

interface InvestigationType {
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
    setSelectedGroup(value);
  };

  const handleSubmit = async (e: any) => {
    if (!saving || state.form !== {}) {
      setSaving(true);

      const keys = Object.keys(state.form);
      const data = keys.map((k) => {
        const d = {
          investigation: k,
          value: state.form[k]?.value,
          session: session,
        };
        return d;
      });

      const res = await dispatch(
        createInvestigation(data, props.consultationId)
      );

      if (res && res.status === 200 && res.data) {
        setSaving(false);
        console.log(data);
        Notification.Success({
          msg: "Shift request updated successfully",
        });
        navigate(
          `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`
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
