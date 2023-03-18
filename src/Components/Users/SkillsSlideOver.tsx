import { useCallback, useEffect, useMemo, useState } from "react";
import SlideOverCustom from "../../CAREUI/interactive/SlideOver";
import { SkillModel, SkillObjectModel } from "../Users/models";
import { SkillSelect } from "../Common/SkillSelect";
import {
  addUserSkill,
  getUserListSkills,
  deleteUserSkill,
} from "../../Redux/actions";
import UnlinkSkillDialog from "./UnlinkSkillDialog";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import ButtonV2 from "../Common/components/ButtonV2";
import AuthorizeFor from "../../Utils/AuthorizeFor";
import { useIsAuthorized } from "../../Common/hooks/useIsAuthorized";
import {
  AddSkillsPlaceholder,
  SkillsArray,
} from "./SkillsSlideOver.Components";
import Spinner from "../Common/Spinner";

interface IProps {
  username: string;
  show: boolean;
  setShow: (show: boolean) => void;
}

const CONTACT_YOUR_ADMIN_COPY = "Contact your admin to add skills";
const ADD_COPY = "Add";

export default ({ show, setShow, username }: IProps) => {
  const [skills, setSkills] = useState<SkillModel[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillObjectModel | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSkill, setDeleteSkill] = useState<SkillModel | null>(null);
  const dispatch: any = useDispatch();

  const fetchSkills = useCallback(
    async (username: string) => {
      setIsLoading(true);
      const res = await dispatch(getUserListSkills({ username }));
      if (res && res.data) {
        setSkills(res.data.results);
      }
      setIsLoading(false);
    },
    [dispatch]
  );

  const addSkill = useCallback(
    async (username: string, skill: SkillObjectModel | null) => {
      if (!skill) return;
      setIsLoading(true);
      const res = await dispatch(addUserSkill(username, skill.id));
      if (res?.status !== 201) {
        Notification.Error({
          msg: "Error while adding skill",
        });
      }
      setSelectedSkill(null);
      setIsLoading(false);
      fetchSkills(username);
    },
    [dispatch, fetchSkills]
  );

  const removeSkill = useCallback(
    async (username: string, skillId: string) => {
      await dispatch(deleteUserSkill(username, skillId));
      setDeleteSkill(null);
      fetchSkills(username);
    },
    [dispatch, fetchSkills]
  );

  useEffect(() => {
    setIsLoading(true);
    if (username) fetchSkills(username);
    setIsLoading(false);
  }, [username, fetchSkills]);

  const authorizeForAddSkill = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"])
  );

  const hasSkills = useMemo(() => skills.length > 0, [skills]);

  return (
    <div className="col-span-4">
      {deleteSkill && (
        <UnlinkSkillDialog
          skillName={deleteSkill.skill_object.name || ""}
          userName={username}
          handleCancel={() => setDeleteSkill(null)}
          handleOk={() => removeSkill(username, deleteSkill.id)}
        />
      )}
      <SlideOverCustom
        open={show}
        setOpen={setShow}
        slideFrom="right"
        title="Skills"
        dialogClass="md:w-[400px]"
      >
        <div>
          <div className="sm:col-start-2 col-span-full sm:col-span-3">
            <div className="tooltip flex items-center gap-2">
              <SkillSelect
                multiple={false}
                name="skill"
                disabled={!authorizeForAddSkill}
                showAll={true}
                showNOptions={8}
                selected={selectedSkill}
                setSelected={setSelectedSkill}
                errors=""
              />
              <ButtonV2
                disabled={!authorizeForAddSkill}
                onClick={() => addSkill(username, selectedSkill)}
              >
                {ADD_COPY}
              </ButtonV2>
              {isLoading ? <Spinner /> : null}
              {!authorizeForAddSkill && (
                <span className="tooltip-text tooltip-bottom -translate-x-24 translate-y-2">
                  {CONTACT_YOUR_ADMIN_COPY}
                </span>
              )}
            </div>
            {/* While loading skills, we want to hide the skills panel because we
            are showing the loading spinner next to the add button */}
            {isLoading ? null : (
              <div className="mb-2 mt-4">
                {hasSkills ? (
                  <SkillsArray
                    isLoading={isLoading}
                    skills={skills}
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
