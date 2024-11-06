import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import { ConsultationModel } from "@/components/Facility/models";
import {
  EmailValidator,
  MultiValidator,
  RequiredFieldValidator,
} from "@/components/Form/FieldValidators";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import { Error, Success } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface Props {
  show: boolean;
  onClose: () => void;
  consultation: ConsultationModel;
}

export default function DischargeSummaryModal(props: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenDischargeSummary, setRegenDischargeSummary] = useState(false);

  const popup = (url: string) => {
    window.open(url, "_blank");
    setDownloading(false);
    props.onClose();
  };

  const waitForDischargeSummary = async () => {
    setGenerating(true);
    Success({ msg: t("generating_discharge_summary") + "..." });

    setTimeout(async () => {
      setGenerating(false);

      const { res, data } = await request(routes.dischargeSummaryPreview, {
        pathParams: { external_id: props.consultation.id },
      });

      if (res?.status === 200 && data) {
        popup(data.read_signed_url);
        return;
      }

      Error({
        msg: t("discharge_summary_not_ready") + " " + t("try_again_later"),
      });
      setDownloading(false);
    }, 7000);
  };

  const handleRegenDischargeSummary = async () => {
    setDownloading(true);
    const { res, error } = await request(routes.dischargeSummaryGenerate, {
      pathParams: { external_id: props.consultation.id },
    });
    if (res?.status === 406) {
      Error({
        msg:
          error?.message ||
          t("discharge_summary_not_ready") + " " + t("try_again_later"),
      });
      setDownloading(false);
      return;
    }
    setRegenDischargeSummary(false);
    waitForDischargeSummary();
  };

  const downloadDischargeSummary = async () => {
    // returns summary or 202 if new create task started
    const { res, data } = await request(routes.dischargeSummaryPreview, {
      pathParams: { external_id: props.consultation.id },
    });

    if (res?.status === 202) {
      // wait for the automatic task to finish
      waitForDischargeSummary();
      return;
    }

    if (res?.status === 200 && data) {
      popup(data.read_signed_url);
      return;
    }

    Error({
      msg: t("discharge_summary_not_ready") + " " + t("try_again_later"),
    });
    setDownloading(false);
  };

  const handleDownload = async () => {
    setDownloading(true);

    if (regenDischargeSummary) {
      await handleRegenDischargeSummary();
      return;
    }

    downloadDischargeSummary();
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

    const { res } = await request(routes.dischargeSummaryEmail, {
      pathParams: { external_id: props.consultation.id },
    });

    if (res?.status === 202) {
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
        <div className="mb-6 flex flex-col gap-1">
          <span className="text-sm text-secondary-800">
            {t("email_discharge_summary_description")}
          </span>
          <span className="text-sm text-warning-600">
            <CareIcon
              icon="l-exclamation-triangle"
              className="mr-1 text-base"
            />
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
        {!props.consultation.discharge_date && (
          <CheckBoxFormField
            name="regenDischargeSummary"
            label={"Regenerate discharge summary"}
            onChange={(e) => setRegenDischargeSummary(e.value)}
          />
        )}
        <div className="flex flex-col-reverse gap-2 lg:flex-row lg:justify-end">
          <Cancel onClick={props.onClose} />
          <Submit onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
            ) : (
              <CareIcon icon="l-file-download-alt" className="text-lg" />
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
              <CareIcon icon="l-spinner" className="animate-spin text-lg" />
            ) : (
              <CareIcon icon="l-fast-mail" className="text-lg" />
            )}
            <span>{t("send_email")}</span>
          </Submit>
        </div>
      </div>
    </DialogModal>
  );
}
