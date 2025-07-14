import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import { Encounter } from "@/types/emr/encounter/encounter";

interface Props {
  encounter: Encounter;
}

export default function EncounterOverviewDevices({ encounter }: Props) {
  const devices = usePluginDevices().filter((d) => !!d.encounterOverview);

  return (
    <>
      {devices.map((device) => {
        const Component = device.encounterOverview;
        if (!Component) return null;
        return <Component key={device.type} encounter={encounter} />;
      })}
    </>
  );
}
