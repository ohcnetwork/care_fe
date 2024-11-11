import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import SlideOverCustom from "@/CAREUI/interactive/SlideOver";

import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { SkillSelect } from "@/components/Common/SkillSelect";
import {
  AddSkillsPlaceholder,
  SkillsArray,
} from "@/components/Users/SkillsSlideOverComponents";
import UnlinkSkillDialog from "@/components/Users/UnlinkSkillDialog";
import { SkillModel, SkillObjectModel } from "@/components/Users/models";

import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import AuthorizeFor from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface IProps {
  username: string;
  show: boolean;
  setShow: (show: boolean) => void;
}

export default ({ show, setShow, username }: IProps) => {
  /* added const {t} hook here and relevant text to Common.json to avoid eslint error  */
  const { t } = useTranslation();
  const [selectedSkill, setSelectedSkill] = useState<SkillObjectModel | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSkill, setDeleteSkill] = useState<SkillModel | null>(null);

  const {
    data: skills,
    loading: skillsLoading,
    refetch: refetchUserSkills,
  } = useQuery(routes.userListSkill, {
    pathParams: { username },
  });

  const addSkill = useCallback(
    async (username: string, skill: SkillObjectModel | null) => {
      if (!skill) return;
      setIsLoading(true);
      const { res } = await request(routes.addUserSkill, {
        pathParams: { username },
        body: { skill: skill.id },
      });

      if (!res?.ok) {
        Notification.Error({
          msg: "Error while adding skill",
        });
      } else {
        Notification.Success({
          msg: "Skill added successfully",
        });
      }
      setSelectedSkill(null);
      setIsLoading(false);
      await refetchUserSkills();
    },
    [refetchUserSkills],
  );

  const removeSkill = useCallback(
    async (username: string, skillId: string) => {
      const { res } = await request(routes.deleteUserSkill, {
        pathParams: { username, id: skillId },
      });
      if (res?.status !== 204) {
        Notification.Error({
          msg: "Error while unlinking skill",
        });
      } else {
        Notification.Success({
          msg: "Skill unlinked successfully",
        });
      }
      setDeleteSkill(null);
      await refetchUserSkills();
    },
    [refetchUserSkills],
  );

  const authorizeForAddSkill = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"]),
  );

  const hasSkills = skills?.results?.length || 0 > 0;

  return (
    <div className="col-span-4">
      {deleteSkill && (
        <UnlinkSkillDialog
          skillName={deleteSkill.skill_object.name || ""}
          userName={username}
          onCancel={() => setDeleteSkill(null)}
          onSubmit={() => removeSkill(username, deleteSkill.id)}
        />
      )}
      <SlideOverCustom
        open={show}
        setOpen={(openState) => {
          !deleteSkill && setShow(openState);
        }}
        slideFrom="right"
        title="Skills"
        dialogClass="md:w-[400px]"
      >
        <div>
          <div className="col-span-full sm:col-span-3 sm:col-start-2">
            {(!isLoading || !skillsLoading) && (
              <div
                className={`${
                  !authorizeForAddSkill && "tooltip"
                } flex items-center gap-2`}
              >
                <SkillSelect
                  id="select-skill"
                  multiple={false}
                  name="skill"
                  disabled={!authorizeForAddSkill}
                  showNOptions={Infinity}
                  selected={selectedSkill}
                  setSelected={setSelectedSkill}
                  errors=""
                  className="w-full"
                  userSkills={skills?.results || []}
                />
                <ButtonV2
                  id="add-skill-button"
                  disabled={!authorizeForAddSkill}
                  onClick={() => addSkill(username, selectedSkill)}
                  className="mt-1 h-[45px] w-[74px] text-base"
                >
                  {t("add")}
                </ButtonV2>
                {!authorizeForAddSkill && (
                  <span className="tooltip-text tooltip-bottom -translate-x-24 translate-y-2">
                    {t("contact_your_admin_to_add_skills")}
                  </span>
                )}
              </div>
            )}
            {isLoading || skillsLoading ? (
              <div className="mt-4 flex justify-center">
                <CircularProgress />
              </div>
            ) : (
              <div className="mb-2 mt-4" id="added-user-skills">
                {hasSkills ? (
                  <SkillsArray
                    isLoading={isLoading || skillsLoading}
                    skills={skills?.results || []}
                    authorizeForAddSkill={authorizeForAddSkill}
                    setDeleteSkill={setDeleteSkill}
                  />
                ) : (
                  <AddSkillsPlaceholder />
                )}
              </div>
            )}
          </div>
        </div>
      </SlideOverCustom>
    </div>
  );
};
