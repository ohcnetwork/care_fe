import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import AudioPlayer from "@/components/Common/AudioPlayer";
import { FileUploadModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export default function AudioPlayerDialog({
  open,
  onOpenChange,
  file,
  type,
  associatingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileUploadModel | null;
  type: "encounter" | "patient";
  associatingId: string;
}) {
  const { t } = useTranslation();

  const { data: fileData } = useQuery({
    queryKey: [routes.retrieveUpload, type, file?.id],
    queryFn: query(routes.retrieveUpload, {
      queryParams: { file_type: type, associating_id: associatingId },
      pathParams: { id: file?.id || "" },
    }),
    enabled: !!file?.id,
  });
  const { Player, stopPlayback } = AudioPlayer({
    src: fileData?.read_signed_url || "",
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
