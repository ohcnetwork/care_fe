import { useCallback, useEffect, useState } from "react";
import SlideOverCustom from "../../CAREUI/interactive/SlideOver";
import { classNames } from "../../Utils/utils";
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
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useIsAuthorized } from "../../Common/hooks/useIsAuthorized";

interface IProps {
  username: string;
  show: boolean;
  setShow: (show: boolean) => void;
}

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

  const authorizeForAddSkill = useIsAuthorized(AuthorizeFor(["DistrictAdmin"]));

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
                Add
              </ButtonV2>
              {!authorizeForAddSkill && (
                <span className="tooltip-text tooltip-bottom -translate-x-24 translate-y-2">
                  Contact your district admin to add skills
                </span>
              )}
            </div>
            <div className="mb-2 mt-4">
              {skills.length === 0 ? (
                <div className="mb-2 mt-2 flex flex-col justify-center align-middle content-center h-96">
                  <div className="w-full">
                    <img
                      src={`${process.env.PUBLIC_URL}/images/404.svg`}
                      alt="Error 404"
                      className="w-80 mx-auto"
                    />
                  </div>
                  <p className="text-lg font-semibold text-center text-primary pt-4">
                    Select and add some skills
                  </p>
                </div>
              ) : (
                skills.map((skill, i) => (
                  <div
                    key={`facility_${i}`}
                    className={classNames(
                      "relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-200 rounded md:rounded-lg cursor-pointer"
                    )}
                  >
                    <div className="flex justify-between">
                      <div className="text-lg font-bold">
                        {skill.skill_object.name}
                      </div>
                      <div>
                        <ButtonV2
                          size="small"
                          variant="danger"
                          ghost={true}
                          disabled={isLoading}
                          onClick={() => setDeleteSkill(skill)}
                        >
                          <CareIcon className="care-l-times text-lg" />
                        </ButtonV2>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SlideOverCustom>
    </div>
  );
};
