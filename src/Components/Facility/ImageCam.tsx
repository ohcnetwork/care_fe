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
  const videoRef = useRef<any>(null);
  const photoRef = useRef<any>(null);
  const [camStream, setCamStream] = useState<any>();
  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { exact: props.facingMode } } })
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
