import { LiveKitRoom } from "@livekit/react-components";
import "@livekit/react-components/dist/index.css";
import { useEffect, useState } from "react";
import ButtonV2 from "../Components/Common/components/ButtonV2";

export const LiveKit = (props: {
  sourceUsername: string;
  targetUsername: string;
}) => {
  const [status, setStatus] = useState("Disconnected");
  const [connect, setConnect] = useState(false);
  const [token, setToken] = useState("");

  const getToken = () => {
    const url = `http://127.0.0.1:8000/api/v1/livekit/get_token?source_username=${props.sourceUsername}&target_username=${props.targetUsername}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setToken(data.access);
        console.log(data);
      });
  };

  useEffect(() => {
    async function fetchData() {
      getToken();
    }
    fetchData();
  }, []);

  return (
    <div className="roomContainer">
      <p className="text-md">Welcome {props.sourceUsername} !</p>
      <p className="font-semibold text-md my-4">
        Status:{" "}
        <span
          className={status === "Connected" ? "text-green-600" : "text-red-500"}
        >
          {status}
        </span>
      </p>
      <ButtonV2
        onClick={() => {
          setConnect(!connect);
          if (status != "Connected") {
            setStatus("Connecting...");
          } else {
            setStatus("Disconnected");
          }
        }}
        variant={status === "Connected" ? "danger" : "primary"}
      >
        {status === "Connected" ? "Disconnect" : "Connect"}
      </ButtonV2>
      {connect && token && (
        <LiveKitRoom
          token={token}
          url="wss://livekit.ohc.network"
          onConnected={() => {
            setStatus("Connected");
          }}
          onLeave={() => {
            setStatus("Disconnected");
            setConnect(false);
          }}
        />
      )}
    </div>
  );
};
