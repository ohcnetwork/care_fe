import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { SkillModel } from "./models";
import { Fragment } from "react";

export const AddSkillsPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <div className="my-2 flex h-96 flex-col content-center justify-center align-middle">
      <div className="w-full">
        <img src="/images/404.svg" alt="Error 404" className="mx-auto w-80" />
      </div>
      <p className="pt-4 text-center text-lg font-semibold text-primary">
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
    <Fragment>
      {skills.map((skill, i) => (
        <div
          key={`facility_${i}`}
          className={classNames(
            "relative cursor-pointer rounded px-4 py-5 transition duration-200 ease-in-out hover:bg-gray-200 focus:bg-gray-200 md:rounded-lg lg:px-8"
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
    </Fragment>
  );
};
