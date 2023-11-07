import { useCallback } from "react";
import { useDispatch } from "react-redux";

import AutoCompleteAsync from "@/Components/Form/AutoCompleteAsync";
import { SkillObjectModel } from "@/Components/Users/models";
import { getAllSkills, getUserListSkills } from "@/Redux/actions";

interface SkillSelectProps {
  name: string;
  errors?: string | undefined;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  showAll?: boolean;
  showNOptions?: number;
  disabled?: boolean;
  selected: SkillObjectModel | SkillObjectModel[] | null;
  setSelected: (selected: SkillObjectModel) => void;
  username?: string;
}

export const SkillSelect = (props: SkillSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    searchAll,
    showAll = true,
    showNOptions = 10,
    disabled = false,
    className = "",
    errors = "",
    username,
  } = props;

  const dispatchAction: any = useDispatch();

  const skillSearch = useCallback(
    async (text: string) => {
      const params = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
      };

      const res = await dispatchAction(getAllSkills(params));

      const linkedSkills = await dispatchAction(
        getUserListSkills({ username: username })
      );

      const skillsList = linkedSkills?.data?.results;
      const skillsID: string[] = [];
      skillsList.map((skill: any) => skillsID.push(skill.skill_object.id));
      const skills = res?.data?.results.filter(
        (skill: any) => !skillsID.includes(skill.id)
      );

      return skills;
    },
    [dispatchAction, searchAll, showAll]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      disabled={disabled}
      fetchData={skillSearch}
      showNOptions={showNOptions}
      optionLabel={(option: any) =>
        option.name +
        (option.district_object ? `, ${option.district_object.name}` : "")
      }
      compareBy="id"
      className={className}
      error={errors}
    />
  );
};
