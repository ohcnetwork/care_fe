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
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onClose: () => void;
  consultation: ConsultationModel;
}

export default function DischargeSummaryModal(props: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);

    if (props.consultation.discharge_date) {
      const res = await dispatch(
        previewDischargeSummary({ external_id: props.consultation.id })
      );

      if (res.status === 200) {
        window.open(res.data.read_signed_url, "_blank");
        setDownloading(false);
        props.onClose();
        return;
      }
    }

    await dispatch(
      generateDischargeSummary({ external_id: props.consultation.id })
    );

    setGenerating(true);
    Success({ msg: t("generating_discharge_summary") + "..." });

    setTimeout(async () => {
      setGenerating(false);

      const res = await dispatch(
        previewDischargeSummary({ external_id: props.consultation.id })
      );

      if (res.status === 200) {
        window.open(res.data.read_signed_url, "_blank");
        setDownloading(false);
        props.onClose();
        return;
      }

      Error({
        msg: t("discharge_summary_not_ready") + " " + t("try_again_later"),
      });
      setDownloading(false);
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
      Success({ msg: t("email_success") });
      props.onClose();
    }

    setEmailing(false);
  };

  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title={t("download_discharge_summary")}
      className="md:max-w-2xl"
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-sm text-gray-800">
            {t("email_discharge_summary_description")}
          </span>
          <span className="text-sm text-warning-600">
            <CareIcon className="care-l-exclamation-triangle text-base mr-1" />
            {`${t("disclaimer")}: ${t("generated_summary_caution")}`}
          </span>
        </div>
        <TextFormField
          name="email"
          type="email"
          placeholder={t("email_address")}
          value={email}
          onChange={(e) => setEmail(e.value)}
          error={emailError}
        />
        <div className="flex flex-col-reverse lg:flex-row gap-2 lg:justify-end mt-6">
          <Cancel onClick={props.onClose} />
          <Submit onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <CareIcon className="care-l-spinner text-lg animate-spin" />
            ) : (
              <CareIcon className="care-l-file-download-alt text-lg" />
            )}
            <span>
              {generating
                ? t("generating") + "..."
                : downloading
                ? t("downloading") + "..."
                : t("download")}
            </span>
          </Submit>
          <Submit onClick={handleEmail} disabled={emailing}>
            {emailing ? (
              <CareIcon className="care-l-spinner text-lg animate-spin" />
            ) : (
              <CareIcon className="care-l-fast-mail text-lg" />
            )}
            <span>{t("send_email")}</span>
          </Submit>
        </div>
      </div>
    </DialogModal>
  );
}
