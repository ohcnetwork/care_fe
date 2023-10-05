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
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import {
  FieldChangeEvent,
  FieldChangeEventHandler,
} from "../Form/FormFields/Utils";
import CollapseV2 from "../Common/components/CollapseV2";
import AccordionV2 from "../Common/components/AccordionV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";

interface Props {
  show: boolean;
  onClose: () => void;
  consultation: ConsultationModel;
}

const options = [
  {
    category: "Generic",
    label: "Facility Name",
    value: "patient.facility.name",
  },
  {
    category: "Patient Information",
    label: "Patient Name",
    value: "patient.name",
  },
  {
    category: "Patient Information",
    label: "Patient Gender",
    value: "patient.get_gender_display",
  },
  {
    category: "Patient Information",
    label: "Patient Age",
    value: "patient.age",
  },
  {
    category: "Patient Information",
    label: "Patient Date of Birth",
    value: "patient.date_of_birth",
  },
  {
    category: "Patient Information",
    label: "Patient Blood Group",
    value: "patient.blood_group",
  },
  {
    category: "Patient Information",
    label: "Patient Phone Number",
    value: "patient.phone_number",
  },
  {
    category: "Patient Information",
    label: "Patient Address",
    value: "patient.address",
  },
  {
    category: "Consultation",
    label: "Consultation Status",
    value: "consultation.get_consultation_status_display",
  },
  {
    category: "Consultation",
    label: "Consultation Suggestion",
    value: "consultation.get_suggestion_display",
  },
  {
    category: "Consultation",
    label: "Admission Date",
    value: "consultation.admission_date.date",
    condition: "consultation.suggestion === 'A'",
  },
  {
    category: "Consultation",
    label: "Consultation Notes",
    value: "consultation.consultation_notes",
    condition: "consultation.consultation_notes",
  },
  {
    category: "Consultation",
    label: "Special Instruction",
    value: "consultation.special_instruction",
    condition: "consultation.special_instruction",
  },
  {
    category: "Consultation",
    label: "Prescribed Medication",
    value: "consultation.prescribed_medication",
    condition: "consultation.prescribed_medication",
  },
  {
    category: "Consultation",
    label: "Procedure",
    value: "consultation.procedure",
    condition: "consultation.procedure",
  },
  {
    category: "Consultation",
    label: "Investigation",
    value: "investigations",
    condition: "consultation.investigation",
  },
  {
    category: "Patient Information",
    label: "Present Health",
    value: "patient.present_health",
  },
  {
    category: "Patient Information",
    label: "Ongoing Medication",
    value: "patient.ongoing_medication",
  },
  {
    category: "Patient Information",
    label: "Allergies",
    value: "patient.allergies",
  },
  {
    category: "Patient Information",
    label: "IP No",
    value: "consultation.ip_no",
  },
  {
    category: "Patient Information",
    label: "Weight",
    value: "consultation.weight",
  },
  {
    category: "Patient Information",
    label: "Height",
    value: "consultation.height",
  },
  {
    category: "Patient Information",
    label: "Symptoms",
    value: "consultation.get_symptoms_display|title",
    condition: "consultation.consultation_status !== 1",
  },
  {
    category: "Patient Information",
    label: "Symptoms Onset Date",
    value: "consultation.symptoms_onset_date.date",
    condition: "consultation.consultation_status !== 1",
  },
  {
    category: "Patient Information",
    label: "Date of Result",
    value: "patient.date_of_result.date",
    condition: "patient.disease_status === 2 && patient.date_of_result",
  },
  {
    category: "Patient Information",
    label: "Is Vaccinated",
    value: "patient.is_vaccinated",
    condition: "patient.disease_status === 2 && patient.is_vaccinated",
  },
  {
    category: "Patient Medical History",
    label: "Medical History",
    value: "medical_history",
    condition: "medical_history",
  },
  {
    category: "HCX Information",
    label: "Insurer Name",
    value: "hcx",
    condition: "hcx",
  },
  {
    category: "Diagnosis",
    label: "Provisional Diagnosis",
    value: "provisional_diagnosis",
    condition: "provisional_diagnosis",
  },
  {
    category: "Diagnosis",
    label: "Diagnosis ID",
    value: "diagnosis",
    condition: "diagnosis",
  },
  {
    category: "Discharge",
    label: "Discharge Notes",
    value: "consultation.discharge_notes",
    condition: "consultation.suggestion === 'DD'",
  },
  {
    category: "Discharge",
    label: "Death Date Time",
    value: "consultation.death_datetime",
    condition: "consultation.suggestion === 'DD'",
  },
  {
    category: "Discharge",
    label: "Death Confirmed By",
    value: "consultation.death_confirmed_by",
    condition: "consultation.suggestion === 'DD'",
  },
  {
    category: "Discharge",
    label: "Discharge Summary",
    value: "consultation.suggestion === 'R'",
  },
  {
    category: "Prescription",
    label: "Prescription",
    value: "prescriptions",
    condition: "prescriptions",
  },
  {
    category: "PRN Prescription",
    label: "PRN Prescription",
    value: "prn_prescriptions",
    condition: "prn_prescriptions",
  },
  {
    category: "Examination",
    label: "Examination Details",
    value: "consultation.examination_details",
  },

  {
    category: "Sample Information",
    label: "Sample",
    value: "samples",
    condition: "samples",
  },
  {
    category: "Consultation",
    label: "Treatment Plan",
    value: "consultation.treatment_plan",
  },
  {
    category: "Admission Details",
    label: "Daily Rounds",
    value: "dailyrounds",
    condition: "dailyrounds",
  },
  {
    category: "Discharge Information",
    label: "Discharge Date",
    value: "consultation.discharge_date",
  },
  {
    category: "Discharge Information",
    label: "Discharge Reason",
    value: "consultation.get_discharge_reason_display",
  },
  {
    category: "Discharge Information",
    label: "Discharge Prescription ",
    value: "discharge_prescriptions",
    condition:
      "discharge_prescriptions",
  },
  {
    category: "Discharge Information",
    label: "Discharge PRN Prescription ",
    value: "discharge_prn_prescriptions",
    condition:
      "discharge_prn_prescriptions",
  },
  
  {
    category: "Discharge Information",
    label: "Discharge Notes",
    value: "consultation.discharge_notes",
  },
  {
    category: "Discharge Information",
    label: "Verified By",
    value: "consultation.verified_by|linebreaks",
  },
  {
    category: "Discharge Information",
    label: "Discharge Summary",
    value: "summary.discharge_summary",
  },
];

export default function DischargeAISummaryModal(props: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const [email, setEmail] = useState<string>("");
  const [additional_details, setAdditionalDetails] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenDischargeSummary, setRegenDischargeSummary] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleCheckboxChange = (e: FieldChangeEvent<boolean>) => {
    const value = e.name;
    setSelectedOptions((prevSelectedOptions) => {
      if (prevSelectedOptions.includes(value)) {
        return prevSelectedOptions.filter((option) => option !== value);
      }
      return [...prevSelectedOptions, value];
    });
  };

  const popup = (url: string) => {
    window.open(url, "_blank");
    setDownloading(false);
    props.onClose();
  };

  const waitForDischargeSummary = async () => {
    setGenerating(true);
    Success({ msg: t("generating_discharge_summary") + "..." });

    let section_data = {}
    if (selectedOptions.length > 0) {
      section_data = selectedOptions.join("\n");
    }

    setTimeout(async () => {
      setGenerating(false);

      const res = await dispatch(
        generateDischargeSummary({section_data: section_data, is_ai: true},{ external_id: props.consultation.id })
      );

      if (res.status === 200) {
        popup(res.data.read_signed_url);
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
    const res = await dispatch(
      generateDischargeSummary({},{ external_id: props.consultation.id })
    );
    if (res.status === 406) {
      Error({
        msg:
          res.data?.message ||
          t("discharge_summary_not_ready") + " " + t("try_again_later"),
      });
      setDownloading(false);
      return;
    }
    setRegenDischargeSummary(false);
    waitForDischargeSummary();
  };

  const downloadDischargeSummary = async () => {
    let section_data = {}
    if (selectedOptions.length > 0) {
      for(let selectedOption of selectedOptions) {
        let [category, label, value] = selectedOption.split('-')
        let value_split = value.split('.')
        if (value_split[0] in section_data) {
          section_data[value_split[0]] += `${label}: {{ ${value}|safe }}\n`
        } else {
          section_data[value_split[0]] = `${category}\n\n${label}: {{ ${value}|safe }}\n`
        }
      }
    }

    // returns summary or 202 if new create task started
    const res = await dispatch(
      generateDischargeSummary({section_data: section_data, is_ai: true},{ external_id: props.consultation.id })
    );

    if (res.status === 202) {
      // wait for the automatic task to finish
      //waitForDischargeSummary();
      return;
    }

    if (res.status === 200) {
      popup(res.data.read_signed_url);
      return;
    }

    Error({
      msg: t("discharge_summary_not_ready") + " " + t("try_again_later"),
    });
    setDownloading(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
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

    const res = await dispatch(
      emailDischargeSummary({ email }, { external_id: props.consultation.id })
    );

    if (res.status === 202) {
      Success({ msg: t("email_success") });
      props.onClose();
    }

    setEmailing(false);
  };

  const optionsByCategory = options.reduce((acc: any, option) => {
    // if (option.condition && !eval(option.condition)) {
    //   return acc;
    // }

    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {});

  const handleCategoryCheckboxChange = (category: string, checked: boolean) => {
    const optionsInCategory = optionsByCategory[category];
    const optionValuesInCategory = optionsInCategory.map(
      (option) => `${option.category}-${option.label}-${option.value}`
    );
    const newSelectedOptions = checked
      ? [...selectedOptions, ...optionValuesInCategory]
      : selectedOptions.filter(
          (option) => !optionValuesInCategory.includes(option)
        );
    setSelectedOptions(newSelectedOptions);
  };

  return (
    <DialogModal
      show={props.show}
      onClose={props.onClose}
      title="Download AI Discharge Summary"
      className="md:max-w-2xl"
    >
      <div className="flex flex-col">
        <div className="mb-6 flex flex-col gap-1">
          <span className="text-sm text-gray-800">
            Select the fields you want to include in the discharge summary
          </span>
          <span className="text-sm text-warning-600">
            <CareIcon className="care-l-exclamation-triangle mr-1 text-base" />
            {`${t("disclaimer")}: ${t("generated_summary_caution")}`}
          </span>
        </div>

        <div>
          {Object.entries(optionsByCategory).map(([category, options]) => (
            <AccordionV2
              key={category}
              prefix={
                <input
                  className="relative float-left mr-2 h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-[rgba(0,0,0,0.25)] bg-white outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:absolute checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:bg-white focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent"
                  type="checkbox"
                  id={`${category}-all`}
                  name={`${category}-all`}
                  checked={options
                    .filter((option) => option.category === category)
                    .every((option) =>
                      selectedOptions.includes(
                        `${option.category}-${option.label}-${option.value}`
                      )
                    )}
                  onChange={(e) =>
                    handleCategoryCheckboxChange(category, e.target.checked)
                  }
                />
              }
              title={category}
              className="mb-2 rounded-lg border border-gray-300 p-4"
            >
              <div className="mt-4">
                {options.map((option) => (
                  <div key={`${option.category}-${option.label}-${option.value}`}>
                    <CheckBoxFormField
                      name={`${option.category}-${option.label}-${option.value}`}
                      label={option.label}
                      id={`${option.category}-${option.label}-${option.value}`}
                      value={selectedOptions.includes(
                        `${option.category}-${option.label}-${option.value}`
                      )}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                ))}
              </div>
            </AccordionV2>
          ))}
        </div>

        <TextAreaFormField
          rows={4}
          name="additional_details"
          placeholder="Additional Details"
          value={additional_details}
          onChange={(e) => setAdditionalDetails(e.value)}
        />

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
              <CareIcon className="care-l-spinner animate-spin text-lg" />
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
          {/* <Submit onClick={handleEmail} disabled={emailing}>
            {emailing ? (
              <CareIcon className="care-l-spinner animate-spin text-lg" />
            ) : (
              <CareIcon className="care-l-fast-mail text-lg" />
            )}
            <span>{t("send_email")}</span>
          </Submit> */}
        </div>
      </div>
    </DialogModal>
  );
}
