import { useCallback, useEffect, useState } from "react";
import SlideOverCustom from "../../CAREUI/interactive/SlideOver";
import { classNames } from "../../Utils/utils";
import { IconButton, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
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
            <div className="flex">
              <SkillSelect
                multiple={false}
                name="skill"
                showAll={true}
                showNOptions={8}
                selected={selectedSkill}
                setSelected={setSelectedSkill}
                errors=""
              />
              <Button
                color="primary"
                onClick={() => addSkill(username, selectedSkill)}
              >
                Add
              </Button>
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
                        <IconButton
                          size="small"
                          color="primary"
                          disabled={isLoading}
                          onClick={() => setDeleteSkill(skill)}
                        >
                          <CloseIcon />
                        </IconButton>
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
