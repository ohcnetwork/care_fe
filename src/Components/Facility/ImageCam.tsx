import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const ImageCam = forwardRef((props, ref) => {
  const videoRef = useRef<any>(null);
  const photoRef = useRef<any>(null);

  useEffect(() => {
    getVideo();
  }, [videoRef]);

  const getVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300, facingMode: "environment" } })
      .then((stream) => {
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

    const width = 320;
    const height = 240;
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
      console.log(data);
      return data;
    },
  }));

  return (
    <div>
      {/* <button onClick={() => takePhoto()}>Take a photo</button> */}
      <video
        style={{ display: "none" }}
        onCanPlay={() => paintToCanvas()}
        ref={videoRef}
      />
      <canvas ref={photoRef} />
    </div>
  );
});

export default ImageCam;
