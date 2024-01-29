import * as Notify from "../../Utils/Notifications";

import Dropdown, { DropdownItem } from "../Common/components/Menu";
import { useEffect, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import CircularProgress from "../Common/components/CircularProgress";
import DialogModal from "../Common/Dialog";
import OtpFormField from "../Form/FormFields/OtpFormField";
import QRScanner from "../Common/QRScanner";
import TextFormField from "../Form/FormFields/TextFormField";
import { classNames } from "../../Utils/utils";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { ABDMError, ABHAQRContent } from "./models";

export const validateRule = (
  condition: boolean,
  content: JSX.Element | string
) => {
  return (
    <div>
      {condition ? (
        <i className="fas fa-circle-check text-green-500" />
      ) : (
        <i className="fas fa-circle-xmark text-red-500" />
      )}{" "}
      <span
        className={classNames(condition ? "text-primary-500" : "text-red-500")}
      >
        {content}
      </span>
    </div>
  );
};
interface Props {
  patientId?: string;
  patientMobile?: string | undefined;
  onSuccess?: (abha: any) => void;
  show: boolean;
  onClose: () => void;
}

interface draftState {
  currentStep: Step;
  transactionId: string;
  state: any;
}

type Step =
  | "RestoreOptions"
  | "ScanExistingQR"
  | "AadhaarVerification"
  | "MobileVerification"
  | "HealthIDCreation";

const initialState: draftState = {
  currentStep: "AadhaarVerification",
  transactionId: "",
  state: {},
};

export default function LinkABHANumberModal({
  patientId,
  patientMobile,
  onSuccess,
  ...props
}: Props) {
  const [draftState, setDraftState] = useState<draftState>(initialState);
  const [currentStep, setCurrentStep] = useState<Step>(
    localStorage.getItem(`abha-link-${patientId}`) !== null
      ? "RestoreOptions"
      : "AadhaarVerification"
  );
  const [transactionId, setTransactionId] = useState<string>("");

  const handleDraftRestore = () => {
    if (patientId && localStorage.getItem(`abha-link-${patientId}`) !== null) {
      const state = JSON.parse(
        localStorage.getItem(`abha-link-${patientId}`) || ""
      );
      setDraftState(state);
      setCurrentStep(state.currentStep);
      setTransactionId(state.transactionId);
    }
  };

  const title = (
    <div className="flex items-center gap-3">
      <CareIcon className="care-l-link text-xl" />
      <h2 className="text-xl font-bold text-black">
        {currentStep === "ScanExistingQR"
          ? "Link Existing ABHA Number"
          : "Generate ABHA number"}
      </h2>
    </div>
  );

  useEffect(() => {
    if (draftState && patientId) {
      if (
        currentStep !== draftState.currentStep &&
        Object.keys(draftState.state).length !== 0
      ) {
        const state = {
          ...draftState,
          currentStep: currentStep,
          transactionId: transactionId,
          state: {},
        };
        setDraftState(state);
        if (currentStep !== "RestoreOptions") {
          localStorage.setItem(`abha-link-${patientId}`, JSON.stringify(state));
        }
      }
    }
  }, [currentStep, transactionId]);

  const setLocalStorageState = (key: string, value: any) => {
    if (draftState && patientId) {
      const state = {
        ...draftState,
        state: {
          ...draftState.state,
          [key]: value,
        },
      };
      setDraftState(state);
      localStorage.setItem(`abha-link-${patientId}`, JSON.stringify(state));
    }
  };

  if (currentStep === "RestoreOptions") {
    return (
      // eslint-disable-next-line i18next/no-literal-string
      <DialogModal className="max-w-lg" title={"Draft Available"} {...props}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-800">
            You have a pending ABHA linking request. Do you want to continue
            with that?
          </p>
          <div className="flex items-center justify-center gap-2">
            <ButtonV2
              type="button"
              variant="secondary"
              onClick={() => {
                localStorage.removeItem(`abha-link-${patientId}`);
                setCurrentStep("AadhaarVerification");
              }}
            >
              No
            </ButtonV2>
            <ButtonV2
              type="button"
              variant="primary"
              onClick={() => {
                handleDraftRestore();
              }}
            >
              Yes
            </ButtonV2>
          </div>
        </div>
      </DialogModal>
    );
  }

  return (
    <DialogModal className="max-w-lg" title={title} {...props}>
      <div className="p-4">
        {currentStep === "ScanExistingQR" && (
          <ScanABHAQRSection
            patientId={patientId}
            draftState={draftState?.state}
            setLocalStorageState={setLocalStorageState}
            onSuccess={onSuccess}
            closeModal={props.onClose}
          />
        )}

        {currentStep === "AadhaarVerification" && (
          <VerifyAadhaarSection
            setLocalStorageState={setLocalStorageState}
            draftState={draftState?.state}
            onVerified={(transactionId) => {
              setTransactionId(transactionId);
              setCurrentStep("MobileVerification");
            }}
          />
        )}

        {currentStep === "MobileVerification" && transactionId && (
          <VerifyMobileSection
            transactionId={transactionId}
            setLocalStorageState={setLocalStorageState}
            draftState={draftState?.state}
            onVerified={(transactionId) => {
              setTransactionId(transactionId);
              setCurrentStep("HealthIDCreation");
            }}
            patientMobile={patientMobile}
          />
        )}

        {currentStep === "HealthIDCreation" && transactionId && (
          <CreateHealthIDSection
            transactionId={transactionId}
            draftState={draftState?.state}
            setLocalStorageState={setLocalStorageState}
            onCreateSuccess={(abha) => {
              props.onClose();
              onSuccess?.(abha);
            }}
            patientId={patientId}
          />
        )}
      </div>

      <div>
        {["AadhaarVerification", "MobileVerification", "HealthIDCreation"].find(
          (step) => step === currentStep
        ) ? (
          <p
            onClick={() => setCurrentStep("ScanExistingQR")}
            className="cursor-pointer text-center text-sm text-blue-800"
          >
            Already have an ABHA number
          </p>
        ) : (
          <p
            onClick={() => setCurrentStep("AadhaarVerification")}
            className="cursor-pointer text-center text-sm text-blue-800"
          >
            Don't have an ABHA Number
          </p>
        )}
      </div>
    </DialogModal>
  );
}

interface ScanABHAQRSectionProps {
  patientId?: string;
  draftState?: any;
  setLocalStorageState: (key: string, value: any) => void;
  onSuccess?: (abha: any) => void;
  closeModal: () => void;
}

const ScanABHAQRSection = ({
  patientId,
  draftState,
  setLocalStorageState,
  onSuccess,
  closeModal,
}: ScanABHAQRSectionProps) => {
  const [qrValue, setQrValue] = useState(draftState?.qrValue ?? "");
  const [authMethods, setAuthMethods] = useState<string[]>(
    draftState?.authMethods ?? []
  );
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(
    draftState?.selectedAuthMethod ?? ""
  );
  const [txnId, setTxnId] = useState(draftState?.authtxnId ?? "");
  const [otp, setOtp] = useState(draftState?.otp ?? "");
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(
    draftState?.acceptedDisclaimer ?? false
  );
  const [isLoading, setIsLoading] = useState(false);

  const supportedAuthMethods = ["MOBILE_OTP", "AADHAAR_OTP"];

  const setStateByKey = (key: string, value: any) => {
    switch (key) {
      case "qrValue":
        setQrValue(value);
        break;
      case "authMethods":
        setAuthMethods(value);
        break;
      case "selectedAuthMethod":
        setSelectedAuthMethod(value);
        break;
      case "authtxnId":
        setTxnId(value);
        break;
      case "otp":
        setOtp(value);
        break;
      case "acceptedDisclaimer":
        setAcceptedDisclaimer(value);
        break;
      default:
        break;
    }
  };

  const updateStateAndStorage = (key: string, value: any) => {
    setLocalStorageState(key, value);
    setStateByKey(key, value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-semibold text-gray-700">Loading</span>
        <CircularProgress className="text-green-500" />
      </div>
    );
  }

  return (
    <div>
      <QRScanner
        label="Enter ABHA Number / ABHA Address"
        value={qrValue}
        disabled={!!authMethods.length}
        onChange={(value) => {
          if (value[0] && !isNaN(Number(value[0]))) {
            // 92-1234-1234-1234
            if ([2, 7, 12].includes(value.length)) {
              if (qrValue.length && qrValue[qrValue.length - 1] === "-") {
                value.slice(value.length - 1);
              } else {
                value += "-";
              }
            }
          }
          updateStateAndStorage("qrValue", value);
        }}
        parse={async (value: string) => {
          if (!value) return;
          setIsLoading(true);

          try {
            const abha = JSON.parse(value) as ABHAQRContent;

            const { res, data } = await request(routes.abha.linkViaQR, {
              body: {
                patientId,
                hidn: abha?.hidn,
                phr: abha?.hid,
                name: abha?.name,
                gender: abha?.gender,
                dob: abha?.dob.replace(/\//g, "-"),
                address: abha?.address,
                "dist name": abha?.district_name,
                "state name": abha?.["state name"],
              },
            });

            if (res?.status === 200 || res?.status === 202) {
              Notify.Success({ msg: "Request sent successfully" });
              localStorage.removeItem(`abha-link-${patientId}`);
              onSuccess?.({
                ...data,
                abha_profile: {
                  ...data?.abha_profile,
                  healthIdNumber: data?.abha_profile?.abha_number,
                  healthId: data?.abha_profile?.health_id,
                  mobile: abha?.mobile,
                  monthOfBirth:
                    data?.abha_profile?.date_of_birth?.split("-")[1],
                  dayOfBirth: data?.abha_profile?.date_of_birth?.split("-")[2],
                  yearOfBirth: data?.abha_profile?.date_of_birth?.split("-")[0],
                },
              });
            } else {
              Notify.Error({ msg: "Linking Failed" });
            }
          } catch (e) {
            console.log(e);
            Notify.Error({ msg: "Invalid ABHA QR" });
          } finally {
            setIsLoading(false);
            closeModal();
          }
        }}
      />
      {!txnId && (
        <div>
          <span className="items-center text-xs text-gray-800">
            <input
              type="checkbox"
              checked={acceptedDisclaimer}
              onChange={(e) => {
                updateStateAndStorage("acceptedDisclaimer", e.target.checked);
              }}
              className="mr-2 rounded border-gray-700 shadow-sm ring-0 ring-offset-0"
            />
            I declare that the ABHA No. of the patient is voluntarily provided
            by the patient (or guardian or nominee of the patient).
          </span>
        </div>
      )}
      {txnId && (
        <OtpFormField
          name="otp"
          onChange={(value) => updateStateAndStorage("otp", value as string)}
          value={otp}
          label="Enter 6 digit OTP!"
          error=""
        />
      )}
      <div className="mt-4 flex items-center justify-center gap-2">
        <>
          {txnId ? (
            <ButtonV2
              className="w-full"
              disabled={otp.length !== 6}
              onClick={async () => {
                let response = null;
                let Rdata = null;
                let Rerror = null;

                switch (selectedAuthMethod) {
                  case "MOBILE_OTP":
                    {
                      const { res, data, error } = await request(
                        routes.abha.confirmWithMobileOtp,
                        {
                          body: {
                            otp: otp,
                            txnId: txnId,
                            patientId: patientId,
                          },
                        }
                      );
                      response = res;
                      Rdata = data;
                      Rerror = error;
                    }
                    break;

                  case "AADHAAR_OTP":
                    {
                      const { res, data, error } = await request(
                        routes.abha.confirmWithAadhaarOtp,
                        {
                          body: {
                            otp: otp,
                            txnId: txnId,
                            patientId: patientId,
                          },
                        }
                      );
                      response = res;
                      Rdata = data;
                      Rerror = error;
                    }
                    break;
                }

                if (response?.status === 200) {
                  onSuccess?.(Rdata);
                  Notify.Success({
                    msg: "ABHA Number linked successfully",
                  });
                } else {
                  Notify.Error({
                    msg: Rerror ?? "Something went wrong!",
                  });
                }
              }}
            >
              Link
            </ButtonV2>
          ) : authMethods.length ? (
            <Dropdown
              itemClassName="!w-full md:!w-full"
              containerClassName="w-full"
              title="Verify via"
            >
              {authMethods.map((method) => (
                <DropdownItem
                  key={method}
                  onClick={async () => {
                    const { res, data } = await request(
                      routes.abha.initiateAbdmAuthentication,
                      { body: { authMethod: method, healthid: qrValue } }
                    );

                    if (res?.status === 200 && data?.txnId) {
                      updateStateAndStorage("selectedAuthMethod", method);
                      updateStateAndStorage("authtxnId", data.txnId);
                    }
                  }}
                >
                  {method.replace(/_/g, " ")}
                </DropdownItem>
              ))}
            </Dropdown>
          ) : (
            <ButtonV2
              disabled={!qrValue || !acceptedDisclaimer}
              className="w-full"
              onClick={async () => {
                const { res, data } = await request(
                  routes.abha.searchByHealthId,
                  {
                    body: {
                      healthId: qrValue,
                    },
                  }
                );

                if (res?.status === 200 && data?.authMethods) {
                  updateStateAndStorage(
                    "authMethods",
                    data.authMethods?.filter?.((method: string) =>
                      supportedAuthMethods.find(
                        (supported) => supported === method
                      )
                    )
                  );
                }
              }}
            >
              Verify
            </ButtonV2>
          )}
        </>
      </div>
    </div>
  );
};

interface VerifyAadhaarSectionProps {
  onVerified: (transactionId: string) => void;
  draftState?: any;
  setLocalStorageState: (key: string, value: any) => void;
}

const VerifyAadhaarSection = ({
  onVerified,
  draftState,
  setLocalStorageState,
}: VerifyAadhaarSectionProps) => {
  console.log(draftState);
  const [aadhaarNumber, setAadhaarNumber] = useState(
    draftState?.aadhaarNumber ?? ""
  );
  const [aadhaarNumberError, setAadhaarNumberError] = useState<string>(
    draftState?.aadhaarNumberError ?? ""
  );

  const [otp, setOtp] = useState(draftState?.otp ?? "");
  const [otpError, setOtpError] = useState<string>(draftState?.otpError ?? "");

  const [txnId, setTxnId] = useState<string>(draftState?.txnId ?? "");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verified, setIsVerified] = useState(draftState?.verified ?? false);
  const [acceptedDisclaimer1, setAcceptedDisclaimer1] = useState(
    draftState?.acceptedDisclaimer1 ?? false
  );
  const [acceptedDisclaimer2, setAcceptedDisclaimer2] = useState(
    draftState?.acceptedDisclaimer2 ?? false
  );

  const updateStateAndStorage = (key: string, value: any) => {
    setLocalStorageState(key, value);
    setStateByKey(key, value);
  };

  useEffect(() => {
    if (verified && txnId) {
      setTimeout(() => onVerified(txnId), 1000);
    }
  }, [verified]);

  const otpSent = !!txnId;

  const validateAadhaar = () => {
    if (aadhaarNumber.length !== 12 && aadhaarNumber.length !== 16) {
      updateStateAndStorage(
        "aadhaarNumberError",
        "Should be a 12-digit aadhaar number or 16-digit virtual ID"
      );
      return false;
    }

    if (aadhaarNumber.includes(" ")) {
      updateStateAndStorage("aadhaarNumberError", "Should not contain spaces");
      return false;
    }

    return true;
  };

  const sendOtp = async () => {
    if (!validateAadhaar()) return;

    setIsSendingOtp(true);

    const { res, data } = await request(routes.abha.generateAadhaarOtp, {
      body: {
        aadhaar: aadhaarNumber,
      },
    });
    setIsSendingOtp(false);

    if (res?.status === 200 && data) {
      const { txnId } = data;
      updateStateAndStorage("txnId", txnId);
      Notify.Success({
        msg: "OTP has been sent to the mobile number registered with the Aadhar number.",
      });
    } else {
      Notify.Error({ msg: JSON.stringify(data) });
    }
  };

  const resendOtp = async () => {
    if (!validateAadhaar() || !txnId) return;

    setIsSendingOtp(true);
    const { res, data } = await request(routes.abha.resendAadhaarOtp, {
      body: {
        txnId: txnId,
      },
      silent: true,
    });
    setIsSendingOtp(false);

    if (res?.status === 200 && data?.txnId) {
      updateStateAndStorage("txnId", data.txnId);
      Notify.Success({
        msg: "OTP has been resent to the mobile number registered with the Aadhar number.",
      });
    } else {
      Notify.Error({
        msg:
          (data as unknown as ABDMError).details
            ?.map((detail) => detail.message)
            .join(", ")
            .trim() ||
          (data as unknown as ABDMError).message ||
          "OTP resend failed",
      });
    }
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      updateStateAndStorage("otpError", "Must be a 6-digit code");
      return false;
    }

    if (otp.includes(" ")) {
      updateStateAndStorage("otpError", "Should not contain spaces");
      return false;
    }
    return true;
  };

  const verifyOtp = async () => {
    if (!validateOtp() || !txnId) return;

    setIsVerifyingOtp(true);
    const { res, data } = await request(routes.abha.verifyAadhaarOtp, {
      body: {
        otp: otp,
        txnId: txnId,
      },
    });
    setIsVerifyingOtp(false);

    if (res?.status === 200 && data?.txnId) {
      updateStateAndStorage("txnId", data.txnId);
      Notify.Success({ msg: "OTP verified" });
      setIsVerified(true);
    } else {
      Notify.Error({ msg: "OTP verification failed" });
    }
  };

  const setStateByKey = (key: string, value: any) => {
    switch (key) {
      case "aadhaarNumber":
        setAadhaarNumber(value);
        break;
      case "aadhaarNumberError":
        setAadhaarNumberError(value);
        break;
      case "otp":
        setOtp(value);
        break;
      case "otpError":
        setOtpError(value);
        break;
      case "txnId":
        setTxnId(value);
        break;
      case "verified":
        setIsVerified(value);
        break;
      case "acceptedDisclaimer1":
        setAcceptedDisclaimer1(value);
        break;
      case "acceptedDisclaimer2":
        setAcceptedDisclaimer2(value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-center">
        <TextFormField
          name="aadhaar-number"
          label="Aadhaar Number / Virtual ID"
          min={12}
          max={16}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
          placeholder="Enter 12-digit Aadhaar or 16-digit Virtual ID"
          disabled={!!(isSendingOtp || txnId)}
          value={aadhaarNumber}
          onChange={({ value }) =>
            updateStateAndStorage("aadhaarNumber", value)
          }
          error={aadhaarNumberError}
        />
        <span
          className={classNames(
            "ml-2 text-sm font-medium text-gray-600",
            !aadhaarNumberError && "-mt-4"
          )}
        >
          Aadhaar number will not be stored by CARE
        </span>
      </div>

      {!otpSent && (
        <div className="flex flex-col gap-2">
          <span className="items-center text-xs text-gray-800">
            <input
              type="checkbox"
              checked={acceptedDisclaimer1}
              onChange={(e) => {
                updateStateAndStorage("acceptedDisclaimer1", e.target.checked);
              }}
              className="mr-2 rounded border-gray-700 shadow-sm ring-0 ring-offset-0"
            />
            I declare that consent of the patient (or guardian or nominee of the
            patient) is obtained for generation of such ABHA Number as per the{" "}
            <a href="https://docs.coronasafe.network/coronasafe-care-documentation/privacy-policy/privacy-policy-as-per-abdm-guidelines">
              Privacy Policy
            </a>
            .
          </span>

          <span className="items-center text-xs text-gray-800">
            <input
              type="checkbox"
              checked={acceptedDisclaimer2}
              onChange={(e) => {
                updateStateAndStorage("acceptedDisclaimer2", e.target.checked);
              }}
              className="mr-2 rounded border-gray-700 shadow-sm ring-0 ring-offset-0"
            />
            I declare that the Aadhaar Number and demographic details of the
            patient are shared voluntarily by the patient (or guardian or
            nominee of the patient) through CARE with NHA for the sole purpose
            of creation of ABHA Number. The patient understands that such data
            of the patient will be collected, stored and utilized as per{" "}
            <a href="https://abdm.gov.in/publications/policies_regulations/health_data_management_policy">
              ABDM Health Data Management Policy
            </a>
            . The patient authorizes NHA to use the Aadhaar number for
            performing Aadhaar based authentication with UIDAI as per the
            provisions of Aadhaar Act 2016 for the aforesaid purpose.
          </span>
        </div>
      )}

      {otpSent && (
        <OtpFormField
          name="otp"
          onChange={(value) => updateStateAndStorage("otp", value as string)}
          value={otp}
          label="Enter 6-digit OTP sent to the registered mobile"
          disabled={isVerifyingOtp}
          error={otpError}
        />
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <>
          <ButtonV2
            className="w-full"
            disabled={
              isSendingOtp || !acceptedDisclaimer1 || !acceptedDisclaimer2
            }
            onClick={otpSent ? resendOtp : sendOtp}
            variant={otpSent ? "secondary" : "primary"}
          >
            {(isSendingOtp && "Sending OTP...") ||
              (otpSent ? "Resend OTP" : "Send OTP")}
          </ButtonV2>

          {otpSent && (
            <ButtonV2
              className="w-full"
              disabled={isVerifyingOtp}
              onClick={verifyOtp}
            >
              {(verified && "Verified") ||
                (isVerifyingOtp ? "Verifying..." : "Verify")}
            </ButtonV2>
          )}
        </>
      </div>
    </div>
  );
};

interface VerifyMobileSectionProps {
  transactionId: string;
  draftState?: any;
  setLocalStorageState: (key: string, value: any) => void;
  onVerified: (transactionId: string) => void;
  patientMobile?: string | undefined;
}

const VerifyMobileSection = ({
  transactionId,
  draftState,
  setLocalStorageState,
  onVerified,
  patientMobile,
}: VerifyMobileSectionProps) => {
  const [mobile, setMobile] = useState(
    () => (patientMobile || draftState?.mobile) ?? ""
  );
  const [mobileError, setMobileError] = useState<string>(
    draftState?.mobileError ?? ""
  );

  const [otp, setOtp] = useState(draftState?.otp ?? "");
  const [otpError, setOtpError] = useState<string>(draftState?.otpError ?? "");

  const [txnId, setTxnId] = useState<string>(() => transactionId);
  const [otpDispatched, setOtpDispatched] = useState(
    draftState?.otpDispatched ?? false
  );
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verified, setIsVerified] = useState(draftState?.verified ?? false);

  const setStateByKey = (key: string, value: any) => {
    switch (key) {
      case "mobile":
        setMobile(value);
        break;
      case "mobileError":
        setMobileError(value);
        break;
      case "otp":
        setOtp(value);
        break;
      case "otpError":
        setOtpError(value);
        break;
      case "txnId":
        setTxnId(value);
        break;
      case "otpDispatched":
        setOtpDispatched(value);
        break;
      case "verified":
        setIsVerified(value);
        break;
      default:
        break;
    }
  };

  const updateStateAndStorage = (key: string, value: any) => {
    setLocalStorageState(key, value);
    setStateByKey(key, value);
  };

  useEffect(() => {
    if (verified && txnId) {
      setTimeout(() => onVerified(txnId), 1000);
    }
  }, [verified]);

  const validateMobile = () => {
    if (mobile.length !== 10) {
      updateStateAndStorage("mobileError", "Should contain 10-digits");
      return false;
    }

    if (mobile.includes(" ")) {
      updateStateAndStorage("mobileError", "Should not contain spaces");
      return false;
    }

    return true;
  };

  const sendOtp = async () => {
    if (!validateMobile()) return;

    updateStateAndStorage("otpDispatched", false);
    setIsSendingOtp(true);
    const { res, data } = await request(routes.abha.checkAndGenerateMobileOtp, {
      body: {
        mobile: mobile,
        txnId: txnId,
      },
    });
    setIsSendingOtp(false);

    if (res?.status === 200 && data) {
      const { txnId, mobileLinked } = data;
      updateStateAndStorage("txnId", txnId);

      if (mobileLinked) {
        updateStateAndStorage("verified", true);
        Notify.Success({
          msg: "Mobile number verified.",
        });
      } else {
        updateStateAndStorage("otpDispatched", true);
        Notify.Success({
          msg: "OTP has been sent to the mobile number.",
        });
      }
    } else {
      Notify.Error({ msg: JSON.stringify(data) });
    }
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      updateStateAndStorage("otpError", "Must be a 6-digit code");
      return false;
    }

    if (otp.includes(" ")) {
      updateStateAndStorage("otpError", "Should not contain spaces");
      return false;
    }
    return true;
  };

  const verifyOtp = async () => {
    if (!validateOtp()) return;

    setIsVerifyingOtp(true);
    const { res, data } = await request(routes.abha.verifyMobileOtp, {
      body: {
        txnId: txnId,
        otp: otp,
      },
    });
    setIsVerifyingOtp(false);

    if (res?.status === 200 && data?.txnId) {
      updateStateAndStorage("txnId", data.txnId);
      Notify.Success({ msg: "OTP verified" });
      updateStateAndStorage("verified", true);
    } else {
      Notify.Error({ msg: "OTP verification failed" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TextFormField
        name="mobile-number"
        label="Mobile Number"
        min={10}
        max={10}
        inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
        placeholder="Enter patients mobile number"
        disabled={isSendingOtp}
        value={mobile}
        onChange={({ value }) => updateStateAndStorage("mobile", value)}
        error={mobileError}
      />

      {otpDispatched ? (
        <OtpFormField
          name="otp"
          label="Enter 6-digit OTP sent to the registered mobile"
          disabled={isVerifyingOtp}
          value={otp}
          onChange={(value) => updateStateAndStorage("otp", value as string)}
          error={otpError}
        />
      ) : (
        <p className="-mt-4 text-sm text-warning-600">
          <CareIcon className="care-l-exclamation-triangle h-4 w-4" /> OTP is
          generated if the above phone number is not linked with given Aadhaar
          number.
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <ButtonV2
          className="w-full"
          disabled={isSendingOtp}
          onClick={sendOtp}
          variant={otpDispatched ? "secondary" : "primary"}
        >
          {(isSendingOtp && "Sending OTP...") ||
            (otpDispatched ? "Resend OTP" : "Send OTP")}
        </ButtonV2>

        {otpDispatched && (
          <ButtonV2
            className="w-full"
            disabled={isVerifyingOtp}
            onClick={verifyOtp}
          >
            {(verified && "Verified") ||
              (isVerifyingOtp ? "Verifying..." : "Verify")}
          </ButtonV2>
        )}
      </div>
    </div>
  );
};

interface CreateHealthIDSectionProps {
  transactionId: string;
  draftState?: any;
  setLocalStorageState: (key: string, value: any) => void;
  onCreateSuccess: (abha: any) => void;
  patientId?: string;
}

const CreateHealthIDSection = ({
  transactionId,
  draftState,
  setLocalStorageState,
  onCreateSuccess,
  patientId,
}: CreateHealthIDSectionProps) => {
  const [healthId, setHealthId] = useState(draftState?.healthId ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [isHealthIdInputInFocus, setIsHealthIdInputInFocus] = useState(
    draftState?.isHealthIdInputInFocus ?? false
  );

  const setStateByKey = (key: string, value: any) => {
    switch (key) {
      case "healthId":
        setHealthId(value);
        break;
      case "isHealthIdInputInFocus":
        setIsHealthIdInputInFocus(value);
        break;
      default:
        break;
    }
  };

  const updateStateAndStorage = (key: string, value: any) => {
    setLocalStorageState(key, value);
    setStateByKey(key, value);
  };

  const handleCreateHealthId = async () => {
    setIsCreating(true);
    const { res, data } = await request(routes.abha.createHealthId, {
      body: {
        healthId: healthId,
        txnId: transactionId,
        patientId: patientId,
      },
    });
    if (res?.status === 200) {
      Notify.Success({ msg: "Abha Address created" });
      localStorage.removeItem(`abha-link-${patientId}`);
      onCreateSuccess(data);
    } else {
      Notify.Error({ msg: JSON.stringify(data) });
    }
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <TextFormField
        name="health-id"
        label="Enter Abha Address"
        placeholder="Enter Abha Address"
        disabled={isCreating}
        value={healthId}
        onChange={({ value }) => {
          updateStateAndStorage("healthId", value);
        }}
        onFocus={() => updateStateAndStorage("isHealthIdInputInFocus", true)}
        onBlur={() => updateStateAndStorage("isHealthIdInputInFocus", false)}
      />

      <p className="-mt-4 text-sm text-warning-600">
        <CareIcon className="care-l-exclamation-triangle h-4 w-4" /> Existing
        ABHA Address is used if ABHA Number already exists.
      </p>

      {isHealthIdInputInFocus && (
        <div className="mb-2 pl-2 text-sm text-gray-500">
          {validateRule(
            healthId.length >= 4,
            "Should be atleast 4 character long"
          )}
          {validateRule(
            isNaN(Number(healthId[0])) && healthId[0] !== ".",
            "Shouldn't start with a number or dot (.)"
          )}
          {validateRule(
            healthId[healthId.length - 1] !== ".",
            "Shouldn't end with a dot (.)"
          )}
          {validateRule(
            /^[0-9a-zA-Z.]+$/.test(healthId),
            "Should only contain letters, numbers and dot (.)"
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <ButtonV2
          className="w-full"
          disabled={
            isCreating || !/^(?![\d.])[a-zA-Z0-9.]{4,}(?<!\.)$/.test(healthId)
          }
          onClick={handleCreateHealthId}
        >
          {isCreating ? "Creating Abha Address..." : "Create Abha Address"}
        </ButtonV2>
      </div>
    </div>
  );
};
