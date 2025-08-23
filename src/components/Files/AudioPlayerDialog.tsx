import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import AudioPlayer, { AudioPlayerRef } from "@/components/Common/AudioPlayer";

import query from "@/Utils/request/query";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

export default function AudioPlayerDialog({
  open,
  onOpenChange,
  file,
  type,
  associatingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileReadMinimal | null;
  type: "encounter" | "patient";
  associatingId: string;
}) {
  const { t } = useTranslation();
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const { data: fileData } = useQuery({
    queryKey: [fileApi.get, type, file?.id],
    queryFn: query(fileApi.get, {
      queryParams: { file_type: type, associating_id: associatingId },
      pathParams: { fileId: file?.id || "" },
    }),
    enabled: !!file?.id,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        audioPlayerRef.current?.stopPlayback();
        onOpenChange(false);
      }}
      aria-labelledby="audio-player-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-4 w-[calc(100vw-2.5rem)] sm:w-[calc(100%-2rem)]"
        aria-describedby="audio-player"
      >
        <DialogHeader>
          <DialogTitle>{t("play_audio")}</DialogTitle>
        </DialogHeader>
        <AudioPlayer
          ref={audioPlayerRef}
          src={fileData?.read_signed_url || ""}
        />
      </DialogContent>
    </Dialog>
  );
}
