import { useEffect, useState, useReducer } from "react";
import axios from "axios";
import {
  SAMPLE_TEST_STATUS,
  SAMPLE_TEST_RESULT,
  SAMPLE_FLOW_RULES,
} from "../../Common/constants";
import { SampleTestModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { createUpload, editUpload } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { header_content_type, LinearProgressWithLabel } from "./FileUpload";
import { Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ConfirmDialog from "../Common/ConfirmDialog";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import TextFormField from "../Form/FormFields/TextFormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { useTranslation } from "react-i18next";

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
  const [file, setfile] = useState<File>();
  const [contentType, setcontentType] = useState<string>("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [uploadDone, setUploadDone] = useState<boolean>(false);
  const redux_dispatch: any = useDispatch();

  const currentStatus = SAMPLE_TEST_STATUS.find(
    (i) => i.text === sample.status
  );

  const status = String(sample.status) as keyof typeof SAMPLE_FLOW_RULES;
  const validStatusChoices = statusChoices.filter(
    (i) => status && statusFlow[status] && statusFlow[status].includes(i.text)
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

  const uploadfile = (response: any) => {
    const url = response.data.signed_url;
    const internal_name = response.data.internal_name;
    const f = file;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`);

    const config = {
      headers: {
        "Content-type": contentType,
        "Content-disposition": "inline",
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };
    axios
      .put(url, newFile, config)
      .then(() => {
        setUploadStarted(false);
        setUploadDone(true);
        redux_dispatch(
          editUpload(
            { upload_completed: true },
            response.data.id,
            "SAMPLE_MANAGEMENT",
            sample.id?.toString() ?? ""
          )
        );
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch(() => {
        setUploadStarted(false);
      });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): any => {
    if (e.target.files == null) {
      throw new Error("Error finding e.target.files");
    }
    setfile(e.target.files[0]);
    const fileName = e.target.files[0].name;
    const ext: string = fileName.split(".")[1];
    setcontentType(header_content_type[ext]);
    return e.target.files[0];
  };
  const handleUpload = async () => {
    const f = file;
    if (f === undefined) return;
    const category = "UNSPECIFIED";
    const name = f.name;
    setUploadStarted(true);
    setUploadDone(false);
    const requestData = {
      original_name: name,
      file_type: "SAMPLE_MANAGEMENT",
      name: `${sample.patient_name} Sample Report`,
      associating_id: sample.id,
      file_category: category,
    };
    redux_dispatch(createUpload(requestData))
      .then(uploadfile)
      .catch(() => {
        setUploadStarted(false);
      });
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
              Upload Report :
            </span>
            {uploadStarted ? (
              <LinearProgressWithLabel value={uploadPercent} />
            ) : (
              <div className="mb-4 mt-3 flex flex-wrap justify-between gap-2">
                <label className="button-size-default button-shape-square button-primary-default inline-flex h-min max-w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500">
                  <CareIcon className="care-l-file-upload-alt text-lg" />
                  <span className="max-w-full truncate">
                    {file ? file.name : t("choose_file")}
                  </span>
                  <input
                    title="changeFile"
                    onChange={onFileChange}
                    type="file"
                    hidden
                  />
                </label>
                <Submit
                  type="submit"
                  onClick={handleUpload}
                  disabled={uploadDone}
                >
                  <CareIcon className="care-l-cloud-upload text-lg" />
                  <span>Upload</span>
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
