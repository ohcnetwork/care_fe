import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Submit } from "@/components/Common/ButtonV2";
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

interface Props {
  sample: any;
  handleOk: (sample: any, status: number, result: number) => void;
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
      await fileUpload.handleFileUpload(sample.id);
      if (!fileUpload.error) {
        Notification.Success({ msg: "File Uploaded Successfully" });
      } else {
        Notification.Error({ msg: `Upload failed: ${fileUpload.error}` });
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
              Upload Report:
            </span>
            {fileUpload.progress !== null &&
            fileUpload.progress !== undefined ? (
              <LinearProgressWithLabel value={fileUpload.progress} />
            ) : (
              <div className="mb-4 mt-3 flex flex-wrap justify-between gap-2">
                <label className="button-size-default button-shape-square button-primary-default inline-flex h-min max-w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500">
                  <CareIcon icon="l-file-upload-alt" className="text-lg" />
                  <span className="max-w-full truncate">
                    {fileUpload.files?.[0]?.name || t("choose_file")}
                  </span>
                  <fileUpload.Input />
                </label>
                {fileUpload.fileNames.length > 0 && (
                  <CareIcon
                    icon="l-times"
                    className="text-lg cursor-pointer mt-2 mr-4"
                    onClick={fileUpload.clearFiles}
                  />
                )}
                <Submit
                  type="button"
                  onClick={handleUpload}
                  disabled={!fileUpload.files.length}
                >
                  <CareIcon icon="l-cloud-upload" className="text-lg" />
                  <span>{t("upload")}</span>
                </Submit>
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
