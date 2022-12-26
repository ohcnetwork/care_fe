import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

interface ImageCamProps {
  facingMode?: string;
}
const ImageCam = forwardRef((props: ImageCamProps, ref) => {
  const DEFAULT_CAMERA = { video: true };
  const FRONT_CAMERA = { video: { facingMode: "user" } };
  const [camPos, setCamPos] = useState<any>(DEFAULT_CAMERA);
  const videoRef = useRef<any>(null);
  const photoRef = useRef<any>(null);
  const [camStream, setCamStream] = useState<any>();
  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia(camPos)
      .then((stream) => {
        console.log(stream);
        setCamStream(stream);
        const video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const paintToCanvas = () => {
    const video = videoRef.current;
    const photo = photoRef.current;
    const ctx = photo.getContext("2d");

    const width = 640;
    const height = 480;
    photo.width = width;
    photo.height = height;

    return setInterval(() => {
      ctx.drawImage(video, 0, 0, width, height);
    }, 200);
  };

  useImperativeHandle(ref, () => ({
    getScreenshot() {
      const photo = photoRef.current;
      const data = photo.toDataURL("image/png");
      return data;
    },
    switchCamera() {
      if (camPos === DEFAULT_CAMERA) {
        setCamPos(FRONT_CAMERA);
      } else {
        setCamPos(DEFAULT_CAMERA);
      }
    },
    stopCamera() {
      const tracks = camStream.getTracks();
      tracks.forEach((track: { stop: () => any }) => track.stop());
    },
  }));

  return (
    <div>
      <video
        className="hidden"
        onCanPlay={() => paintToCanvas()}
        ref={videoRef}
      />
      <canvas ref={photoRef} />
    </div>
  );
});

export default ImageCam;
