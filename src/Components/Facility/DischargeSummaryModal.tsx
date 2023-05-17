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
import {
  emailDischargeSummary,
  generateDischargeSummary,
} from "../../Redux/actions";
import { Error, Success } from "../../Utils/Notifications";
import { previewDischargeSummary } from "../../Redux/actions";

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

  const handleDownload = async () => {
    setDownloading(true);

    const res = await dispatch(
      previewDischargeSummary({ external_id: props.consultation.id })
    );

    if (res.status === 200) {
      window.open(res.data.read_signed_url, "_blank");
      setDownloading(false);
      props.onClose();
      return;
    }

    const generateRes = dispatch(
      generateDischargeSummary({ external_id: props.consultation.id })
    );

    if (generateRes.status !== 200) {
      Error({ msg: "Something went wrong." });
      setDownloading(false);
      return;
    }

    Success({ msg: "Generating discharge summary..." });
    setTimeout(async () => {
      const res = await dispatch(
        previewDischargeSummary({ external_id: props.consultation.id })
      );
      if (res.status === 200) {
        window.open(res.data.read_signed_url, "_blank");
        setDownloading(false);
        props.onClose();
      } else {
        Error({
          msg: "Discharge summary is not ready yet. Please try again later.",
        });
        setDownloading(false);
      }
    }, 5000);
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
      props.onClose();
    }

    setEmailing(false);
  };

  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Download discharge summary"
      className="md:max-w-2xl"
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-sm text-gray-800">
            Please enter your email id to receive the discharge summary.
          </span>
          <span className="text-sm text-warning-600">
            <CareIcon className="care-l-exclamation-triangle text-base mr-1" />
            Disclaimer: This is an automatically generated email using
            information captured from CARE.
          </span>
        </div>
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
          <span className="block sm:inline text-sm font-medium">
            Verify you've entered the correct email address before continuing.
            We cannot deliver the email if the email address is invalid.
          </span>
        </div>
        <div className="flex flex-col-reverse lg:flex-row gap-2 lg:justify-end mt-6">
          <Cancel onClick={props.onClose} />
          <Submit onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <CareIcon className="care-l-spinner text-lg animate-spin" />
            ) : (
              <CareIcon className="care-l-file-download-alt text-lg" />
            )}
            <span>Download</span>
          </Submit>
          <Submit onClick={handleEmail} disabled={emailing}>
            {emailing ? (
              <CareIcon className="care-l-spinner text-lg animate-spin" />
            ) : (
              <CareIcon className="care-l-fast-mail text-lg" />
            )}
            <span>Send email</span>
          </Submit>
        </div>
      </div>
    </DialogModal>
  );
}
