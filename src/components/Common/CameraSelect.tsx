"use client";

import { t } from "i18next";
import type React from "react";
import { useCallback, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useCameraSelect from "@/hooks/useCameraSelect";

interface CameraMenuProps {
  onChange?: (deviceId: string) => void;
  onSwitchCamera: () => void;
}

const CameraMenu: React.FC<CameraMenuProps> = ({
  onChange,
  onSwitchCamera,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { devices, selectedDeviceId, handleValueChange } = useCameraSelect({
    onChange,
  });

  const [tempSelectedCamera, setTempSelectedCamera] =
    useState(selectedDeviceId);

  const handleOpenDialog = useCallback(() => {
    setTempSelectedCamera(selectedDeviceId);
    setDialogOpen(true);
  }, [selectedDeviceId]);

  const handleSavePreferredCamera = useCallback(() => {
    handleValueChange(tempSelectedCamera);
    setDialogOpen(false);
  }, [tempSelectedCamera, handleValueChange]);

  const handleDialogSelectChange = useCallback((value: string) => {
    setTempSelectedCamera(value);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CareIcon icon="l-ellipsis-v" />
            <span className="sr-only">Camera options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            {`${t("switch")} ${t("camera")}`}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenDialog}>
            <CareIcon icon="l-setting" />
            {t("set_preferred_camera")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("set_preferred_camera")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={tempSelectedCamera}
              onValueChange={handleDialogSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.length === 0 ? (
                  <SelectItem value="no-camera">
                    No cameras available
                  </SelectItem>
                ) : (
                  devices.map((device) => (
                    <SelectItem
                      key={device.deviceId}
                      value={device.deviceId || "No camera available"}
                    >
                      {device.label || `Camera ${device.deviceId}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferredCamera}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CameraMenu;
