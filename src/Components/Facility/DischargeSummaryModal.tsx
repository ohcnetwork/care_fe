import { useState } from "react";
import DialogModal from "../Common/Dialog";
import TextFormField from "../Form/FormFields/TextFormField";
import { ConsultationModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import {
  EmailValidator,
  MultiValidator,
  RequiredFieldValidator,
} from "../Form/FieldValidators";
import { useDispatch } from "react-redux";
import { emailDischargeSummary } from "../../Redux/actions";
import { Success } from "../../Utils/Notifications";

interface Props {
  show: boolean;
  onClose: () => void;
  consultation: ConsultationModel;
}

export default function DischargeSummaryModal(props: Props) {
  const dispatch = useDispatch<any>();
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
  };

  const handleEmail = async () => {
    setEmailing(true);

    const emailError = MultiValidator<string>([
      RequiredFieldValidator(),
      EmailValidator(),
    ])(email);

    if (emailError) {
      setEmailError(emailError);
      setEmailing(false);
      return;
    }

    const res = await dispatch(
      emailDischargeSummary({ email }, { external_id: props.consultation.id })
    );

    if (res.status === 200) {
      Success({
        msg: "We will be sending an email shortly. Please check your inbox.",
      });
    }
  };

  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Download discharge summary"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1"></div>
        <TextFormField
          name="email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.value)}
          error={emailError}
        />
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="block sm:inline font-bold">
            Verify you've entered the correct email address before continuing.
            We cannot deliver the email if the email address is invalid.
          </strong>
        </div>
        <div className="flex flex-col-reverse lg:flex-row lg:justify-end">
          <Cancel onClick={props.onClose} />
          <Submit onClick={handleDownload} disabled={emailing || downloading}>
            <CareIcon className="care-l-file-download-alt text-lg" />
            <span>Download</span>
          </Submit>
          <Submit onClick={handleEmail} disabled={emailing || downloading}>
            <CareIcon className="care-l-fast-mail text-lg" />
            <span>Send email</span>
          </Submit>
        </div>
      </div>
    </DialogModal>
  );
}
