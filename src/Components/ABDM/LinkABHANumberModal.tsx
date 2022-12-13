import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import {
  createHealthId,
  generateAadhaarOtp,
  generateMobileOtp,
  resentAadhaarOtp,
  verifyAadhaarOtp,
  verifyMobileOtp,
} from "../../Redux/actions";
import * as Notify from "../../Utils/Notifications";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import TextFormField from "../Form/FormFields/TextFormField";

interface Props {
  patientId: string;
  patientMobile?: string | undefined;
  show: boolean;
  onClose: () => void;
}

type Step = "AadhaarVerification" | "MobileVerification" | "HealthIDCreation";

export default function LinkABHANumberModal({
  // patientId,
  patientMobile,
  ...props
}: Props) {
  const [currentStep, setCurrentStep] = useState<Step>("AadhaarVerification");
  const [transactionId, setTransactionId] = useState<string>("sds");

  const title = (
    <div className="flex gap-3">
      <CareIcon className="care-l-link text-xl" />
      <h2 className="text-xl text-black font-bold">Link ABHA Number</h2>
    </div>
  );

  return (
    <DialogModal title={title} {...props}>
      <div className="p-4">
        {currentStep == "AadhaarVerification" && (
          <VerifyAadhaarSection
            onVerified={(transactionId) => {
              setTransactionId(transactionId);
              setCurrentStep("MobileVerification");
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
            onCreateSuccess={() => props.onClose()}
          />
        )}
      </div>
    </DialogModal>
  );
}

interface VerifyAadhaarSectionProps {
  onVerified: (transactionId: string) => void;
}

const VerifyAadhaarSection = ({ onVerified }: VerifyAadhaarSectionProps) => {
  const dispatch = useDispatch<any>();

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarNumberError, setAadhaarNumberError] = useState<string>();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();

  const [txnId, setTxnId] = useState<string>();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verified, setIsVerified] = useState(false);

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
            "ml-2 text-gray-600 text-sm font-medium",
            !aadhaarNumberError && "-mt-4"
          )}
        >
          Aadhaar number will not be stored by CARE
        </span>
      </div>

      {otpSent && (
        <TextFormField
          name="otp"
          label="Enter 6-digit OTP sent to the registered mobile"
          min={6}
          max={6}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
          placeholder="OTP"
          disabled={isVerifyingOtp}
          value={otp}
          onChange={({ value }) => setOtp(value)}
          error={otpError}
        />
      )}

      <div className="flex gap-2 items-center justify-end mt-4">
        <ButtonV2
          disabled={isSendingOtp}
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
    const res = await dispatch(generateMobileOtp(txnId, mobile));
    setIsSendingOtp(false);

    if (res.status === 200 && res.data) {
      const { txnId } = res.data;
      setTxnId(txnId);
      setOtpDispatched(true);
      Notify.Success({
        msg: "OTP has been sent to the mobile number.",
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

      {otpDispatched && (
        <TextFormField
          name="otp"
          label="Enter 6-digit OTP sent to the registered mobile"
          min={6}
          max={6}
          inputClassName="text-black tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal text-center"
          placeholder="OTP"
          disabled={isVerifyingOtp}
          value={otp}
          onChange={({ value }) => setOtp(value)}
          error={otpError}
        />
      )}

      <div className="flex gap-2 items-center justify-end mt-4">
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
  onCreateSuccess: (transactionId: string) => void;
}

const CreateHealthIDSection = ({
  transactionId,
  onCreateSuccess,
}: CreateHealthIDSectionProps) => {
  const dispatch = useDispatch<any>();
  const [healthId, setHealthId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateHealthId = async () => {
    setIsCreating(true);
    const res = await dispatch(
      createHealthId({ txnId: transactionId, healthId })
    );
    if (res.status === 200) {
      Notify.Success({ msg: "Health ID created" });
      onCreateSuccess(res.data.txnId);
    } else {
      Notify.Error({ msg: JSON.stringify(res.data) });
    }
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <TextFormField
        name="health-id"
        label="Enter Health ID"
        placeholder="Enter Health ID"
        disabled={isCreating}
        value={healthId}
        onChange={({ value }) => setHealthId(value)}
      />

      <div className="flex gap-2 items-center justify-end mt-4">
        <ButtonV2 disabled={isCreating} onClick={handleCreateHealthId}>
          {isCreating ? "Creating Health ID..." : "Create Health ID"}
        </ButtonV2>
      </div>
    </div>
  );
};
