import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

interface ImageCamProps {
  facingMode?: string;
}
const ImageCam = forwardRef((props: ImageCamProps, ref) => {
  const DEFAULT_CAMERA = useMemo(
    () => ({ video: { facingMode: "environment" } }),
    []
  );
  const FRONT_CAMERA = useMemo(() => ({ video: { facingMode: "user" } }), []);
  // Use useMemo to avoid unexpected behaviour while rerendering
  /*
     { video: true } - Default Camera View
     { video: { facingMode: environment } } - Back Camera
     { video: { facingMode: "user" } } - Front Camera
   */
  const [camPos, setCamPos] = useState<any>(FRONT_CAMERA);
  const videoRef = useRef<any>(null);
  const photoRef = useRef<any>(null);
  const [camStream, setCamStream] = useState<any>();
  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    console.log("new stream", camPos);
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
      console.log("ll");
      console.log(camPos, "kk");
      if (camPos === 0) {
        setCamPos(DEFAULT_CAMERA);
        getVideo();
        paintToCanvas();
      } else {
        setCamPos(FRONT_CAMERA);
        getVideo();
        paintToCanvas();
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
