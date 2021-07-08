import React, { useState, useCallback, useReducer } from "react";
import { InputLabel, Button } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { statusType, useAbortableEffect } from "../../Common/utils";

import {
  getAllSkills,
  getUserSkills,
  updateUserSkills,
  deleteUserSkill,
} from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import { SelectField } from "../Common/HelperInputFields";
import { SkillModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import loadable from "@loadable/component";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const initialSkill = [{ id: "", name: "Choose Skills", description: "" }];

export default function UserSkillAdd(props: any) {
  const { username } = props;

  const dispatchAction: any = useDispatch();
  // const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<Array<SkillModel>>([]);
  const [skills, setSkills] = useState<Array<SkillModel>>([]);
  const [userSkills, setUserSkills] = useState<Array<any>>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);

      const res = await dispatchAction(getAllSkills({}));
      if (!status.aborted) {
        if (res && res.data) {
          setAllSkills(res.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction]
  );

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setSelectedSkill(value);
  };

  const validateField = () => {
    let invalidField = false;
    if (selectedSkill === null || selectedSkill === "") {
      setError("Please select a skill");
      invalidField = true;
    }
    return !invalidField;
  };

  const fetchUserSkills = useCallback(async () => {
    setIsLoading(true);
    const res = await dispatchAction(getUserSkills(username));
    if (res && res?.data?.results) {
      setUserSkills(res.data.results);
    }
    setIsLoading(false);
  }, [dispatchAction, username]);

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
      fetchUserSkills();
    },
    [fetchData, username]
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validated = validateField();

    if (validated) {
      setIsLoading(true);
      const data = { skill: selectedSkill ? selectedSkill : undefined };
      const res = await dispatchAction(updateUserSkills(username, data));
      if (res && res.status == 201 && res.data) {
        setSelectedSkill(null);
        Notification.Success({
          msg: "Skill Added Successfully",
        });
        setError("");
        fetchUserSkills();
      }
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: any) => {
    const res = await dispatchAction(deleteUserSkill(username, id));

    if (res && res.status == 204) {
      Notification.Success({
        msg: "Skill removed successfully",
      });
      fetchUserSkills();
    }
  };

  const goBack = () => {
    console.log("done");
    window.history.go(-1);
  };

  let skillList: any[] = [];
  if (userSkills.length) {
    skillList = userSkills.map((x, i) => {
      return (
        <tr key={`skill_${i}`} className="bg-white">
          <td>
            <p className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
              {i + 1}
            </p>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            <span className="text-cool-gray-900 font-medium">
              {x?.skill_object?.name}
            </span>
          </td>
          <td className="px-6 py-4 text-left whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            <span className="text-cool-gray-900 font-medium">
              {x?.skill_object?.description}
            </span>
          </td>
          <td className="px-6 py-4 text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
            <span className="text-cool-gray-900 font-medium">
              <button
                type="button"
                className="px-3 py-2 w-20 border border-red-500 text-center text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:text-red-500 focus:outline-none focus:border-red-300 focus:shadow-outline-blue active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                onClick={() => handleDelete(x?.id)}
              >
                Remove
              </button>
            </span>
          </td>
        </tr>
      );
    });
  }

  let manageSkills: any = null;

  if (isLoading) {
    manageSkills = (
      <tr className="bg-white">
        <td
          colSpan={4}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <Loading />
        </td>
      </tr>
    );
  } else if (userSkills.length) {
    manageSkills = skillList;
  } else if (userSkills.length === 0) {
    manageSkills = (
      <tr className="bg-white">
        <td
          colSpan={4}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-no-wrap">No skills added</p>
        </td>
      </tr>
    );
  }

  console.log(skills, userSkills);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10">
      <div className=" px-4">
        <PageTitle title="Skills" className="my-4" />
        <InputLabel className="text-lg fonst-semibold my-2">
          Add Skills
        </InputLabel>
        <SelectField
          name="skill"
          variant="standard"
          value={selectedSkill}
          options={[...initialSkill, ...allSkills]}
          optionValue="name"
          onChange={handleChange}
          errors={error}
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button
          color="primary"
          variant="contained"
          type="submit"
          style={{ marginLeft: "10px" }}
          onClick={(e) => handleSubmit(e)}
        >
          {" "}
          Add Skill{" "}
        </Button>
      </div>

      <div className="mt-6 align-middle min-w-full overflow-x-auto shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-cool-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                No.
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                Skill
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-left text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wide">
                Description
              </th>
              <th className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wide">
                Delete
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-cool-gray-200">
            {manageSkills}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <Button
          color="primary"
          variant="contained"
          type="submit"
          style={{ marginLeft: "10px" }}
          startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
          onClick={() => goBack()}
        >
          {" "}
          Done{" "}
        </Button>
      </div>
    </div>
  );
}
