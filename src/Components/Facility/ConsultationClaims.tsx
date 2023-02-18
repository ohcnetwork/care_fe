import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { HCXActions } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import CreateClaimCard from "../HCX/CreateClaimCard";
import { HCXClaimModel } from "../HCX/models";

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
  const dispatch = useDispatch<any>();
  const [claims, setClaims] = useState<HCXClaimModel[]>();

  useEffect(() => {
    async function fetchClaims() {
      const res = await dispatch(
        HCXActions.claims.list({
          consultation: consultationId,
        })
      );

      if (res.data && res.data.results) {
        setClaims(res.data.results);
      }
    }

    fetchClaims();
  }, [consultationId]);

  return (
    <div className="pb-2 relative flex flex-col">
      <PageTitle
        title="Claims"
        className="pl-6 flex-grow-0"
        backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
      />

      <div className="flex flex-col gap-16 w-full max-w-3xl mx-auto">
        <div className="p-8 bg-white rounded-lg">
          <CreateClaimCard
            consultationId={consultationId}
            patientId={patientId}
            onClaimCreated={(claim) => {
              setClaims([claim, ...(claims || [])]);
            }}
          />
        </div>

        <div className="flex flex-col gap-8">
          {/* TODO: list claim detail cards */}
        </div>
      </div>
    </div>
  );
}
