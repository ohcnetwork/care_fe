import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { LinearProgressWithLabel } from "@/components/Files/FileUpload";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useFileUpload from "@/hooks/useFileUpload";

import {
  SAMPLE_FLOW_RULES,
  SAMPLE_TEST_RESULT,
  SAMPLE_TEST_STATUS,
} from "@/common/constants";

import * as Notification from "@/Utils/Notifications";

import { SampleTestModel } from "./models";

interface Props {
  sample: SampleTestModel;
  handleOk: (sample: SampleTestModel, status: number, result: number) => void;
  handleCancel: () => void;
}

const statusChoices = [...SAMPLE_TEST_STATUS];
const statusFlow = { ...SAMPLE_FLOW_RULES };

const initForm: any = {
  confirm: false,
  status: 0,
  result: 0,
  disabled: true,
};

const initialState = {
  form: { ...initForm },
};

const updateStatusReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    default:
      return state;
  }
};
const UpdateStatusDialog = (props: Props) => {
  const { t } = useTranslation();
  const { sample, handleOk, handleCancel } = props;
  const [state, dispatch] = useReducer(updateStatusReducer, initialState);

  const fileUpload = useFileUpload({
    type: "SAMPLE_MANAGEMENT",
    allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
    allowNameFallback: true,
  });
  const currentStatus = SAMPLE_TEST_STATUS.find(
    (i) => i.text === sample.status,
  );

  const status = String(sample.status) as keyof typeof SAMPLE_FLOW_RULES;
  const validStatusChoices = statusChoices.filter(
    (i) => status && statusFlow[status] && statusFlow[status].includes(i.text),
  );

  useEffect(() => {
    const form = { ...state.form };
    form.status = 0;
    dispatch({ type: "set_form", form });
  }, []);

  const okClicked = () => {
    handleOk(sample, state.form.status, state.form.result);
    dispatch({ type: "set_form", form: initForm });
  };

  const cancelClicked = () => {
    handleCancel();
    dispatch({ type: "set_form", form: initForm });
  };

  const handleChange = ({ name, value }: FieldChangeEvent<unknown>) => {
    const form = { ...state.form };
    form[name] = name === "status" || name === "result" ? Number(value) : value;
    form.disabled =
      !form.status || !form.confirm || (form.status === 7 && !form.result);
    dispatch({ type: "set_form", form });
  };

  const handleUpload = async () => {
    if (fileUpload.files.length > 0) {
      if (!fileUpload.fileNames[0]) {
        Notification.Error({
          msg: "Please enter a file name before uploading",
        });
        return;
      }
      if (sample.id) {
        await fileUpload.handleFileUpload(sample.id);
        if (!fileUpload.error) {
          return;
        } else {
          Notification.Error({ msg: `Upload failed: ${fileUpload.error}` });
        }
      } else {
        Notification.Error({ msg: "Sample ID is missing" });
      }
    } else {
      Notification.Error({ msg: "No file selected for upload" });
    }
  };

  return (
    <ConfirmDialog
      title="Update Sample Test Status"
      show
      onClose={cancelClicked}
      onConfirm={okClicked}
      disabled={state.form.disabled}
      action="Update Status"
    >
      <div className="mt-4 flex flex-col">
        <TextFormField
          label="Current Status"
          name="currentStatus"
          value={currentStatus?.desc}
          disabled
          onChange={handleChange}
        />
        <SelectFormField
          label="New Status"
          name="status"
          value={state.form.status}
          options={validStatusChoices}
          optionLabel={(i) => i.desc}
          optionValue={(i) => i.id}
          onChange={handleChange}
        />
        {Number(state.form.status) === 7 && (
          <>
            <SelectFormField
              label="Result"
              name="result"
              value={state.form.result}
              options={SAMPLE_TEST_RESULT}
              optionLabel={(i) => i.text}
              optionValue={(i) => i.id}
              onChange={handleChange}
            />
            <span className="font-semibold leading-relaxed">
              {t("upload_report")}:
            </span>
            {fileUpload.files[0] ? (
              <div className="mb-8 rounded-lg border border-secondary-300 bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
                  <span>
                    <CareIcon icon="l-paperclip" className="mr-2" />
                    {fileUpload.files[0].name}
                  </span>
                </div>
                <TextFormField
                  name="sample_file_name"
                  type="text"
                  label={t("enter_file_name")}
                  id="upload-file-name"
                  value={fileUpload.fileNames[0] || ""}
                  disabled={fileUpload.uploading}
                  onChange={(e) => fileUpload.setFileName(e.value)}
                  error={fileUpload.error || undefined}
                  required
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={fileUpload.uploading}
                    className="w-full"
                    id="upload_file_button"
                    variant={"primary"}
                  >
                    <CareIcon icon="l-check" className="mr-2" />
                    {t("upload")}
                  </Button>
                  <Button
                    variant={"destructive"}
                    onClick={fileUpload.clearFiles}
                    disabled={fileUpload.uploading}
                  >
                    <CareIcon icon="l-trash-alt" className="mr-2" />
                    {t("discard")}
                  </Button>
                </div>
                {!!fileUpload.progress && (
                  <LinearProgressWithLabel value={fileUpload.progress} />
                )}
              </div>
            ) : (
              <div className="mt-5 mb-8 flex w-full flex-col items-center gap-4 md:flex-row">
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary-500/20 bg-primary-500/10 p-3 text-primary-700 transition-all hover:bg-primary-500/20 md:p-6">
                  <CareIcon icon={"l-file-upload-alt"} className="text-2xl" />
                  <div className="text-lg">{t("choose_file")}</div>
                  <fileUpload.Input />
                </label>
              </div>
            )}
          </>
        )}
        <CheckBoxFormField
          label="I agree to update the sample test status."
          name="confirm"
          value={state.form.confirm}
          onChange={handleChange}
        />
      </div>
    </ConfirmDialog>
  );
};

export default UpdateStatusDialog;
