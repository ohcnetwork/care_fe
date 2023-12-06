import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { getAllSkills } from "../../Redux/actions";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import { SkillModel, SkillObjectModel } from "../Users/models";

interface SkillSelectProps {
  id?: string;
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
  userSkills?: SkillModel[];
}

export const SkillSelect = (props: SkillSelectProps) => {
  const {
    id,
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
    //username,
    userSkills,
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
      const skillsID: string[] = [];
      userSkills?.map((skill: SkillModel) =>
        skillsID.push(skill.skill_object.id)
      );
      const skills = res?.data?.results.filter(
        (skill: any) => !skillsID.includes(skill.id)
      );
      return skills;
    },
    [dispatchAction, searchAll, userSkills, showAll]
  );

  return (
    <AutoCompleteAsync
      id={id}
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
