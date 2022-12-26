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
  const [camPos, setCamPos] = useState<number>(0);
  const videoRef = useRef<any>(null);
  const photoRef = useRef<any>(null);
  const [camStream, setCamStream] = useState<any>();
  useEffect(() => {
    getVideo();
  }, [videoRef]);
  useEffect(() => {
    console.log(camPos, "jj");
  }, [camPos]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia(camPos === 0 ? DEFAULT_CAMERA : FRONT_CAMERA)
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
      console.log("ll");
      console.log(camPos, "kk");
      if (camPos === 0) {
        setCamPos(1);
      } else {
        setCamPos(0);
      }
      getVideo();
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
