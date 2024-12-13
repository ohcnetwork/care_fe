import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { SkillSelect } from "@/components/Common/SkillSelect";

import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import AuthorizeFor from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import UnlinkSkillDialog from "./UnlinkSkillDialog";
import { SkillModel } from "./models";

const initModalProps: {
  selectedSkill: SkillModel | null;
  toggle: boolean;
} = {
  toggle: false,
  selectedSkill: null,
};

export default function LinkedSkills({ username }: { username: string }) {
  const [modalProps, setModalProps] = useState(initModalProps);
  const [selectedSkill, setSelectedSkill] = useState<SkillModel | null>(null);
  const { t } = useTranslation();

  const { data: skills, refetch: refetchUserSkills } = useTanStackQueryInstead(
    routes.userListSkill,
    {
      pathParams: { username },
    },
  );

  const handleOnClick = (selectedSkill: SkillModel) => {
    setModalProps({
      selectedSkill,
      toggle: true,
    });
  };

  const handleModalCancel = () => {
    setModalProps(initModalProps);
  };

  const handleModalOk = () => {
    removeSkill(username, modalProps.selectedSkill?.id.toString() ?? "");
    setModalProps(initModalProps);
  };

  const authorizeForAddSkill = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"]),
  );

  const addSkill = async (username: string, skill: SkillModel | null) => {
    if (!skill) return;
    const { res } = await request(routes.addUserSkill, {
      pathParams: { username },
      body: { skill: skill.id },
    });
    if (res?.ok) {
      Notification.Success({
        msg: t("skill_added_successfully"),
      });
    } else {
      Notification.Error({
        msg: t("skill_add_error"),
      });
    }
    setSelectedSkill(null);
    setModalProps(initModalProps);
    await refetchUserSkills();
  };

  const removeSkill = async (username: string, skillId: string) => {
    const { res } = await request(routes.deleteUserSkill, {
      pathParams: { username, id: skillId },
    });
    if (res?.status !== 204) {
      Notification.Error({
        msg: t("unlink_skill_error"),
      });
    } else {
      Notification.Success({
        msg: t("unlink_skill_success"),
      });
    }
    await refetchUserSkills();
  };

  const renderSkillButtons = (skill: SkillModel) => {
    return (
      <div id={`skill_${skill.id}`} key={`skill${skill.id}`}>
        <div className="flex flex-row items-center rounded-sm border bg-secondary-100">
          <div className="rounded p-1 text-sm">{skill.skill_object.name}</div>
          {authorizeForAddSkill && (
            <div className="rounded-r bg-secondary-300 px-2 py-1">
              <button
                onClick={() => handleOnClick(skill)}
                title={t("clear_skill")}
                aria-label={t("clear_skill")}
                id="unlink-skill"
              >
                <CareIcon icon="l-multiply" className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {modalProps.toggle && (
        <UnlinkSkillDialog
          userName={username}
          skillName={modalProps.selectedSkill?.skill_object.name ?? ""}
          onCancel={handleModalCancel}
          onSubmit={handleModalOk}
        />
      )}
      <div className="flex flex-col gap-y-6 rounded bg-white p-4 shadow">
        <div className="flex flex-row gap-3">
          <SkillSelect
            id="select-skill"
            multiple={false}
            name="skill"
            disabled={!authorizeForAddSkill}
            showNOptions={Infinity}
            selected={selectedSkill}
            setSelected={setSelectedSkill}
            errors=""
            className="z-10 w-full"
            userSkills={skills?.results || []}
          />
          <ButtonV2
            id="add-skill-button"
            disabled={!authorizeForAddSkill}
            onClick={() => addSkill(username, selectedSkill)}
            className="mt-1 rounded-lg px-6 py-[11px] text-base"
            tooltip={
              !authorizeForAddSkill
                ? t("contact_your_admin_to_add_skills")
                : undefined
            }
          >
            {t("add_skill")}
          </ButtonV2>
        </div>
        {skills && skills?.count > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs">{t("linked_skills")}</p>

            <div
              id="added-user-skills"
              className="flex flex-row flex-wrap gap-3"
            >
              {skills?.results.map((skill: SkillModel) => {
                return renderSkillButtons(skill);
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
