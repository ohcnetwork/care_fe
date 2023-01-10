import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import React, { useState } from "react";
import { SkillSelect } from "../Common/SkillSelect";
import { SkillModel } from "../Users/models";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  paperFullWidth: {
    overflowY: "visible",
  },
  dialogContentRoot: {
    overflowY: "visible",
  },
});

interface Props {
  username: string;
  handleOk: (username: string, skill: SkillModel | SkillModel[] | null) => void;
  handleCancel: () => void;
}

const LinkSkillsDialog = (props: Props) => {
  const { username, handleOk, handleCancel } = props;
  const [skill, setSkill] = useState<any>(null);
  const classes = useStyles();

  const okClicked = () => {
    handleOk(username, skill);
  };

  const cancelClicked = () => {
    handleCancel();
  };

  return (
    <Dialog
      open={true}
      onClose={cancelClicked}
      classes={{
        paper: classes.paperFullWidth,
      }}
    >
      <DialogTitle id="alert-dialog-title">
        Link new Skill to {username}
      </DialogTitle>
      <DialogContent
        classes={{
          root: classes.dialogContentRoot,
        }}
      >
        <div className="md:min-w-[400px]">
          <SkillSelect
            multiple={false}
            name="skill"
            showAll={true}
            showNOptions={8}
            selected={skill}
            setSelected={setSkill}
            errors=""
            className="z-40"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelClicked} color="secondary">
          Cancel
        </Button>
        <Button color="primary" disabled={!skill} onClick={okClicked} autoFocus>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkSkillsDialog;
