import React from "react";
import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { SkillModel } from "./models";

export const AddSkillsPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <div className="mb-2 mt-2 flex flex-col justify-center align-middle content-center h-96">
      <div className="w-full">
        <img src="/images/404.svg" alt="Error 404" className="w-80 mx-auto" />
      </div>
      <p className="text-lg font-semibold text-center text-primary pt-4">
        {t("select_skills")}
      </p>
    </div>
  );
};

type SkillsArrayProps = {
  isLoading: boolean;
  skills: SkillModel[];
  authorizeForAddSkill: boolean;
  setDeleteSkill: (skill: SkillModel) => void;
};

export const SkillsArray = ({
  isLoading,
  skills,
  authorizeForAddSkill,
  setDeleteSkill,
}: SkillsArrayProps) => {
  return (
    <React.Fragment>
      {skills.map((skill, i) => (
        <div
          key={`facility_${i}`}
          className={classNames(
            "relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-200 rounded md:rounded-lg cursor-pointer"
          )}
        >
          <div className="flex justify-between">
            <div className="text-lg font-bold">{skill.skill_object.name}</div>
            <div>
              <ButtonV2
                size="small"
                variant="danger"
                ghost={true}
                disabled={isLoading || !authorizeForAddSkill}
                onClick={() => setDeleteSkill(skill)}
              >
                <CareIcon className="care-l-times text-lg" />
              </ButtonV2>
            </div>
          </div>
        </div>
      ))}
    </React.Fragment>
  );
};
