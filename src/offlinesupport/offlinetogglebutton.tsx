import React from "react";

import { useNetworkStatus } from "./useNetworkstatus";

export const OfflineToggleButton = () => {
  const { isOnline, setIsOnline } = useNetworkStatus();

  const handleToggle = () => {
    setIsOnline(!isOnline);
  };

  return (
    <button
      style={{
        backgroundColor: isOnline ? "green" : "red",
        color: "white",
        padding: "10px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={handleToggle}
    >
      {isOnline ? "Switch to Offline Mode" : "Switch to Online Mode"}
    </button>
  );
};
