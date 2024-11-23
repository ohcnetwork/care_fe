import { useCallback } from "react";

import AutoCompleteAsync from "@/components/Form/AutoCompleteAsync";
import { SkillModel, SkillObjectModel } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface SkillSelectProps {
  id?: string;
  name: string;
  errors?: string | undefined;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  showNOptions?: number;
  disabled?: boolean;
  selected: SkillObjectModel | SkillObjectModel[] | null;
  setSelected: (selected: SkillObjectModel) => void;
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
    showNOptions = 10,
    disabled = false,
    className = "",
    errors = "",
    userSkills,
  } = props;

  const skillSearch = useCallback(
    async (text: string) => {
      const query = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
      };

      const { data } = await request(routes.getAllSkills, { query });
      return data?.results.filter(
        (skill) =>
          !userSkills?.some(
            (userSkill) => userSkill.skill_object.id === skill.id,
          ),
      );
    },
    [searchAll, userSkills],
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
