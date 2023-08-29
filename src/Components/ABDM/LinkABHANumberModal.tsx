import * as Notify from "../../Utils/Notifications";

import Dropdown, { DropdownItem } from "../Common/components/Menu";
import {
  checkAndGenerateMobileOtp,
  confirmWithAadhaarOtp,
  confirmWithMobileOtp,
  createHealthId,
  generateAadhaarOtp,
  initiateAbdmAuthentication,
  linkViaQR,
  resentAadhaarOtp,
  searchByHealthId,
  verifyAadhaarOtp,
  verifyMobileOtp,
} from "../../Redux/actions";
import { useEffect, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import CircularProgress from "../Common/components/CircularProgress";
import DialogModal from "../Common/Dialog";
import OtpFormField from "../Form/FormFields/OtpFormField";
import QRScanner from "../Common/QRScanner";
import TextFormField from "../Form/FormFields/TextFormField";
import { classNames } from "../../Utils/utils";
import { useDispatch } from "react-redux";

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

type Step =
  | "ScanExistingQR"
  | "AadhaarVerification"
  | "MobileVerification"
  | "HealthIDCreation";

export default function LinkABHANumberModal({
  patientId,
  patientMobile,
  onSuccess,
  ...props
}: Props) {
  const [currentStep, setCurrentStep] = useState<Step>("AadhaarVerification");
  const [transactionId, setTransactionId] = useState<string>("sds");

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

  return (
    <DialogModal className="max-w-lg" title={title} {...props}>
      <div className="p-4">
        {currentStep === "ScanExistingQR" && (
          <ScanABHAQRSection
            onSignup={() => {
              setCurrentStep("AadhaarVerification");
            }}
            patientId={patientId}
            onSuccess={onSuccess}
            closeModal={props.onClose}
          />
        )}

        {currentStep === "AadhaarVerification" && (
          <VerifyAadhaarSection
            onVerified={(transactionId) => {
              setTransactionId(transactionId);
              setCurrentStep("MobileVerification");
            }}
            onSignin={() => {
              setCurrentStep("ScanExistingQR");
            }}
          />
        )}

        {currentStep === "MobileVerification" && transactionId && (
          <VerifyMobileSection
            transactionId={transactionId}
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
            onCreateSuccess={(abha) => {
              props.onClose();
              onSuccess?.(abha);
            }}
            patientId={patientId}
          />
        )}
      </div>
    </DialogModal>
  );
}

interface ScanABHAQRSectionProps {
  onSignup: () => void;
  patientId?: string;
  onSuccess?: (abha: any) => void;
  closeModal: () => void;
}

const ScanABHAQRSection = ({
  onSignup,
  patientId,
  onSuccess,
  closeModal,
}: ScanABHAQRSectionProps) => {
  const dispatch = useDispatch<any>();

  const [qrValue, setQrValue] = useState("");
  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("");
  const [txnId, setTxnId] = useState("");
  const [otp, setOtp] = useState("");
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const supportedAuthMethods = ["MOBILE_OTP", "AADHAAR_OTP"];

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
        label="Enter ABHA Number"
        value={qrValue}
        disabled={!!authMethods.length}
        onChange={(value) => {
          if ([2, 7, 12].includes(value.length)) {
            if (qrValue.length && qrValue[qrValue.length - 1] === "-") {
              value.slice(value.length - 1);
            } else {
              value += "-";
            }
          }
          setQrValue(value);
        }}
        parse={async (value: string) => {
          if (!value) return;
          setIsLoading(true);

          try {
            const abha = JSON.parse(value);
            const res = await dispatch(linkViaQR(abha, patientId));

            if (res?.status === 200 || res?.status === 202) {
              Notify.Success({ msg: "Request sent successfully" });
              onSuccess?.({
                ...res.data,
                abha_profile: {
                  ...res.data?.abha_profile,
                  healthIdNumber: res.data?.abha_profile?.abha_number,
                  healthId: res.data?.abha_profile?.health_id,
                  mobile: abha?.mobile,
                  monthOfBirth:
                    res.data?.abha_profile?.date_of_birth?.split("-")[1],
                  dayOfBirth:
                    res.data?.abha_profile?.date_of_birth?.split("-")[2],
                  yearOfBirth:
                    res.data?.abha_profile?.date_of_birth?.split("-")[0],
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
                setAcceptedDisclaimer(e.target.checked);
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
          onChange={(value) => setOtp(value as string)}
          value={otp}
          label="Enter 6 digit OTP!"
          error=""
        />
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          onClick={onSignup}
          className="cursor-pointer text-sm text-blue-800"
        >
          Don't have an ABHA Number
        </span>
        <>
          {txnId ? (
            <ButtonV2
              disabled={otp.length !== 6}
              onClick={async () => {
                let response = null;

                switch (selectedAuthMethod) {
                  case "MOBILE_OTP":
                    response = await dispatch(
                      confirmWithMobileOtp(txnId, otp, patientId)
                    );
                    break;

                  case "AADHAAR_OTP":
                    response = await dispatch(
                      confirmWithAadhaarOtp(txnId, otp, patientId)
                    );
                    break;
                }

                if (response.status === 200) {
                  onSuccess?.(response.data);
                  Notify.Success({
                    msg: "ABHA Number linked successfully",
                  });
                } else {
                  Notify.Error({
                    msg: response?.message ?? "Something went wrong!",
                  });
                }
              }}
            >
              Link
            </ButtonV2>
          ) : authMethods.length ? (
            <Dropdown title="Verify via">
              {authMethods.map((method) => (
                <DropdownItem
                  onClick={async () => {
                    const response = await dispatch(
                      initiateAbdmAuthentication(method, qrValue)
                    );

                    if (response.status === 200 && response?.data?.txnId) {
                      setSelectedAuthMethod(method);
                      setTxnId(response.data.txnId);
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
              onClick={async () => {
                const response = await dispatch(searchByHealthId(qrValue));

                if (response.status === 200 && response?.data?.authMethods) {
                  setAuthMethods(
                    response.data.authMethods?.filter?.((method: string) =>
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
  onSignin: () => void;
}

const VerifyAadhaarSection = ({
  onVerified,
  onSignin,
}: VerifyAadhaarSectionProps) => {
  const dispatch = useDispatch<any>();

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarNumberError, setAadhaarNumberError] = useState<string>();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();

  const [txnId, setTxnId] = useState<string>();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verified, setIsVerified] = useState(false);
  const [acceptedDisclaimer1, setAcceptedDisclaimer1] = useState(false);
  const [acceptedDisclaimer2, setAcceptedDisclaimer2] = useState(false);

  useEffect(() => {
    if (verified && txnId) {
      setTimeout(() => onVerified(txnId), 1000);
    }
  }, [verified]);

  const otpSent = !!txnId;

  const validateAadhaar = () => {
    if (aadhaarNumber.length !== 12 && aadhaarNumber.length !== 16) {
      setAadhaarNumberError(
        "Should be a 12-digit aadhaar number or 16-digit virtual ID"
      );
      return false;
    }

    if (aadhaarNumber.includes(" ")) {
      setAadhaarNumberError("Should not contain spaces");
      return false;
    }

    return true;
  };

  const sendOtp = async () => {
    if (!validateAadhaar()) return;

    setIsSendingOtp(true);
    const res = await dispatch(generateAadhaarOtp(aadhaarNumber));
    setIsSendingOtp(false);

    if (res.status === 200 && res.data) {
      const { txnId } = res.data;
      setTxnId(txnId);
      Notify.Success({
        msg: "OTP has been sent to the mobile number registered with the Aadhar number.",
      });
    } else {
      Notify.Error({ msg: JSON.stringify(res.data) });
    }
  };

  const resendOtp = async () => {
    if (!validateAadhaar() || !txnId) return;

    setIsSendingOtp(true);
    const res = await dispatch(resentAadhaarOtp(txnId));
    setIsSendingOtp(false);

    if (res.status === 200 && res.data.txnId) {
      setTxnId(res.data.txnId);
      Notify.Success({
        msg: "OTP has been resent to the mobile number registered with the Aadhar number.",
      });
    } else {
      Notify.Error({ msg: JSON.stringify(res.data) });
    }
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Must be a 6-digit code");
      return false;
    }

    if (otp.includes(" ")) {
      setOtpError("Should not contain spaces");
      return false;
    }
    return true;
  };

  const verifyOtp = async () => {
    if (!validateOtp() || !txnId) return;

    setIsVerifyingOtp(true);
    const res = await dispatch(verifyAadhaarOtp(txnId, otp));
    setIsVerifyingOtp(false);

    if (res.status === 200 && res.data.txnId) {
      setTxnId(res.data.txnId);
      Notify.Success({ msg: "OTP verified" });
      setIsVerified(true);
    } else {
      Notify.Error({ msg: "OTP verification failed" });
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
          onChange={({ value }) => setAadhaarNumber(value)}
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
                setAcceptedDisclaimer1(e.target.checked);
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
                setAcceptedDisclaimer2(e.target.checked);
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
          onChange={(value) => setOtp(value as string)}
          value={otp}
          label="Enter 6-digit OTP sent to the registered mobile"
          disabled={isVerifyingOtp}
          error={otpError}
        />
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          onClick={onSignin}
          className="cursor-pointer text-sm text-blue-800"
        >
          Already have an ABHA number
        </span>
        <>
          <ButtonV2
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
            <ButtonV2 disabled={isVerifyingOtp} onClick={verifyOtp}>
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
  onVerified: (transactionId: string) => void;
  patientMobile?: string | undefined;
}

const VerifyMobileSection = ({
  transactionId,
  onVerified,
  patientMobile,
}: VerifyMobileSectionProps) => {
  const dispatch = useDispatch<any>();

  const [mobile, setMobile] = useState(() => patientMobile || "");
  const [mobileError, setMobileError] = useState<string>();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();

  const [txnId, setTxnId] = useState<string>(() => transactionId);
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verified, setIsVerified] = useState(false);

  useEffect(() => {
    if (verified && txnId) {
      setTimeout(() => onVerified(txnId), 1000);
    }
  }, [verified]);

  const validateMobile = () => {
    if (mobile.length !== 10) {
      setMobileError("Should contain 10-digits");
      return false;
    }

    if (mobile.includes(" ")) {
      setMobileError("Should not contain spaces");
      return false;
    }

    return true;
  };

  const sendOtp = async () => {
    if (!validateMobile()) return;

    setOtpDispatched(false);
    setIsSendingOtp(true);
    const res = await dispatch(checkAndGenerateMobileOtp(txnId, mobile));
    setIsSendingOtp(false);

    if (res.status === 200 && res.data) {
      const { txnId, mobileLinked } = res.data;
      setTxnId(txnId);

      if (mobileLinked) {
        setIsVerified(true);
        Notify.Success({
          msg: "Mobile number verified.",
        });
      } else {
        setOtpDispatched(true);
        Notify.Success({
          msg: "OTP has been sent to the mobile number.",
        });
      }
    } else {
      Notify.Error({ msg: JSON.stringify(res.data) });
    }
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Must be a 6-digit code");
      return false;
    }

    if (otp.includes(" ")) {
      setOtpError("Should not contain spaces");
      return false;
    }
    return true;
  };

  const verifyOtp = async () => {
    if (!validateOtp()) return;

    setIsVerifyingOtp(true);
    const res = await dispatch(verifyMobileOtp(txnId, otp));
    setIsVerifyingOtp(false);

    if (res.status === 200 && res.data.txnId) {
      setTxnId(res.data.txnId);
      Notify.Success({ msg: "OTP verified" });
      setIsVerified(true);
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
        onChange={({ value }) => setMobile(value)}
        error={mobileError}
      />

      {otpDispatched ? (
        <OtpFormField
          name="otp"
          label="Enter 6-digit OTP sent to the registered mobile"
          disabled={isVerifyingOtp}
          value={otp}
          onChange={(value) => setOtp(value as string)}
          error={otpError}
        />
      ) : (
        <p className="-mt-4 text-sm text-warning-600">
          <CareIcon className="care-l-exclamation-triangle h-4 w-4" /> OTP is
          generated if the above phone number is not linked with given Aadhaar
          number.
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <ButtonV2
          disabled={isSendingOtp}
          onClick={sendOtp}
          variant={otpDispatched ? "secondary" : "primary"}
        >
          {(isSendingOtp && "Sending OTP...") ||
            (otpDispatched ? "Resend OTP" : "Send OTP")}
        </ButtonV2>

        {otpDispatched && (
          <ButtonV2 disabled={isVerifyingOtp} onClick={verifyOtp}>
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
  onCreateSuccess: (abha: any) => void;
  patientId?: string;
}

const CreateHealthIDSection = ({
  transactionId,
  onCreateSuccess,
  patientId,
}: CreateHealthIDSectionProps) => {
  const dispatch = useDispatch<any>();
  const [healthId, setHealthId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isHealthIdInputInFocus, setIsHealthIdInputInFocus] = useState(false);

  const handleCreateHealthId = async () => {
    setIsCreating(true);
    const res = await dispatch(
      createHealthId({ txnId: transactionId, patientId, healthId })
    );
    if (res.status === 200) {
      Notify.Success({ msg: "Abha Address created" });
      onCreateSuccess(res.data);
    } else {
      Notify.Error({ msg: JSON.stringify(res.data) });
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
          setHealthId(value);
        }}
        onFocus={() => setIsHealthIdInputInFocus(true)}
        onBlur={() => setIsHealthIdInputInFocus(false)}
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

      <div className="mt-4 flex items-center justify-end gap-2">
        <ButtonV2
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
