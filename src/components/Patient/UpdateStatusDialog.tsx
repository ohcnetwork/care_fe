import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Submit } from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { LinearProgressWithLabel } from "@/components/Files/FileUpload";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import {
  CreateFileResponse,
  SampleTestModel,
} from "@/components/Patient/models";

import {
  HEADER_CONTENT_TYPES,
  SAMPLE_FLOW_RULES,
  SAMPLE_TEST_RESULT,
  SAMPLE_TEST_STATUS,
} from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";

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

  const uploadfile = (data: CreateFileResponse) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;

    const f = file;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`);

    uploadFile(
      url,
      newFile,
      "PUT",
      {
        "Content-Type": contentType,
        "Content-disposition": "inline",
      },
      (xhr: XMLHttpRequest) => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStarted(false);
          setUploadDone(true);
          request(routes.editUpload, {
            pathParams: {
              id: data.id,
              fileType: "SAMPLE_MANAGEMENT",
              associatingId: sample.id?.toString() ?? "",
            },
            body: { upload_completed: true },
          });
          Notification.Success({ msg: "File Uploaded Successfully" });
        } else {
          setUploadStarted(false);
        }
      },
      setUploadPercent,
      () => {
        setUploadStarted(false);
      },
    );
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files == null) {
      throw new Error("Error finding e.target.files");
    }
    setfile(e.target.files[0]);
    const fileName = e.target.files[0].name;
    const ext: string = fileName.split(".")[1];
    setcontentType(
      HEADER_CONTENT_TYPES[ext as keyof typeof HEADER_CONTENT_TYPES],
    );
    return e.target.files[0];
  };
  const handleUpload = async () => {
    const f = file;
    if (f === undefined) return;
    const category = "UNSPECIFIED";
    const name = f.name;
    setUploadStarted(true);
    setUploadDone(false);

    const { data } = await request(routes.createUpload, {
      body: {
        original_name: name,
        file_type: "SAMPLE_MANAGEMENT",
        name: `${sample.patient_name} Sample Report`,
        associating_id: sample.id ?? "",
        file_category: category,
        mime_type: contentType,
      },
    });

    if (data) {
      uploadfile(data);
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
              Upload Report :
            </span>
            {uploadStarted ? (
              <LinearProgressWithLabel value={uploadPercent} />
            ) : (
              <div className="mb-4 mt-3 flex flex-wrap justify-between gap-2">
                <label className="button-size-default button-shape-square button-primary-default inline-flex h-min max-w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500">
                  <CareIcon icon="l-file-upload-alt" className="text-lg" />
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
                  <CareIcon icon="l-cloud-upload" className="text-lg" />
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
