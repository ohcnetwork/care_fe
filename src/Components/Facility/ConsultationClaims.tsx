import PageTitle from "../Common/PageTitle";
import CreateClaimCard from "../HCX/CreateClaimCard";

interface Props {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

export default function ConsultationClaims({
  facilityId,
  consultationId,
  patientId,
}: Props) {
  return (
    <div className="pb-2 relative flex flex-col">
      <PageTitle
        title="Claims"
        className="pl-6 flex-grow-0"
        backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
      />

      <div className="flex flex-col gap-16 max-w-3xl">
        <CreateClaimCard
          consultationId={consultationId}
          patientId={patientId}
        />

        <div className="flex flex-col gap-8">
          {/* TODO: list claim detail cards */}
        </div>
      </div>
    </div>
  );
}
