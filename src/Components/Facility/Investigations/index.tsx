import React, { useReducer, useState } from "react";
import { MultiSelectField } from "../../Common/HelperInputFields";
import { groups, initForm, testMap } from "./data";
import { TestTable } from "./Table";
import _ from "lodash";
const initialState = {
  form: { ...initForm },
};

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

const Investigation = () => {
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [state, dispatch] = useReducer(testFormReducer, initialState);
  console.log(selectedGroup, state);
  return (
    <>
      <MultiSelectField
        options={groups}
        value={selectedGroup}
        optionValue="name"
        onChange={(e) => setSelectedGroup(e.target.value)}
      />
      {selectedGroup.map((g) => {
        const group = testMap[g] as any;
        return (
          <TestTable
            data={group.tests}
            title={group.name}
            key={group.id}
            state={state.form}
            dispatch={dispatch}
          />
        );
      })}
    </>
  );
};

export default Investigation;
