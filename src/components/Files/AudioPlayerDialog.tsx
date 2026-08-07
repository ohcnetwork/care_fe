import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import AudioPlayer from "@/components/Common/AudioPlayer";

import { createCareFileObjectUrl } from "@/Utils/request/files";
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

  const { data: fileData } = useQuery({
    queryKey: [fileApi.get, type, file?.id],
    queryFn: query(fileApi.get, {
      queryParams: { file_type: type, associating_id: associatingId },
      pathParams: { fileId: file?.id || "" },
    }),
    enabled: !!file?.id,
  });
  // The CARE download route is authenticated, so the audio is fetched and
  // wrapped in an object URL rather than handed to the player as a link.
  const [audio, setAudio] = useState<{ src: string; source: string } | null>(
    null,
  );
  const downloadUrl = fileData?.download_url;

  useEffect(() => {
    if (!downloadUrl) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    createCareFileObjectUrl(downloadUrl)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setAudio({ src: url, source: downloadUrl });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [downloadUrl]);

  // Only play an object URL that belongs to the currently selected file.
  const { Player, stopPlayback } = AudioPlayer({
    src: audio && audio.source === downloadUrl ? audio.src : "",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        stopPlayback();
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
        <Player />
      </DialogContent>
    </Dialog>
  );
}
