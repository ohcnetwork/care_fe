import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DeviceList } from "@/types/device/device";

interface Props {
  device: DeviceList;
}

export default function DeviceCard({ device }: Props) {
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
