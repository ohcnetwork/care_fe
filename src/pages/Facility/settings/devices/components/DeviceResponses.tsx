import { ResourceResponses } from "@/components/Questionnaire/ResourceResponses/ResourceResponses";

interface DeviceResponsesProps {
  facilityId: string;
  deviceId: string;
  deviceName: string;
}

export function DeviceResponses({
  facilityId,
  deviceId,
  deviceName,
}: DeviceResponsesProps) {
  return (
    <ResourceResponses
      facilityId={facilityId}
      subjectType="device"
      subjectId={deviceId}
      subjectName={deviceName}
    />
  );
}
