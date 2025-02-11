import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DeviceList } from "@/types/device/device";

interface Props {
  device: DeviceList;
  onView: (deviceId: string) => void;
  onLink: (deviceId: string) => void;
}

export default function DeviceCard({ device, onView, onLink }: Props) {
  return (
    <Card>
      <CardContent>
        <CardHeader>
          <CardTitle>{device.registered_name}</CardTitle>
        </CardHeader>
      </CardContent>
    </Card>
  );
}
