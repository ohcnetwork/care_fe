import { HCXClaimModel } from "./models";

interface Props {
  consultationId: string;
  patientId: string;
  onClaimCreated: (claim: HCXClaimModel) => void;
}

export default function CreateClaimCard(_props: Props) {
  return <div></div>;
}
