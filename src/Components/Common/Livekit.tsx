import "@livekit/react-components/dist/index.css";

import { useEffect, useState } from "react";

import ButtonV2 from "./components/ButtonV2";
import { LiveKitRoom } from "@livekit/react-components";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";

export const Livekit = (props: {
  sourceUsername: string;
  targetUsername: string;
}) => {
  const [status, setStatus] = useState("Disconnected");
  const [connect, setConnect] = useState(false);
  const [token, setToken] = useState("");

  const getToken = async () => {
    const { res, data } = await request(routes.livekit.create_room, {
      body: {
        source: props.sourceUsername,
        target: props.targetUsername,
      },
    });

    if (res?.status === 201 && data) {
      setToken(data.access);
    }
  };

  useEffect(() => {
    getToken();
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
          url="wss://care-22km03y2.livekit.cloud"
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
