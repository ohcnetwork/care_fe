import { AccountList } from "@/pages/Facility/billing/account/AccountList";

interface AccountsProps {
  patientId: string;
  facilityId?: string;
}

export const Accounts = (props: AccountsProps) => {
  return (
    <div>
      {props.facilityId && (
        <AccountList
          facilityId={props.facilityId}
          patientId={props.patientId}
          hideTitleOnPage
          hidePatientName
          className="mt-2"
        />
      )}
    </div>
  );
};
