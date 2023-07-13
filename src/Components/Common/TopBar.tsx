import React from "react";
import useConfig from "../../Common/hooks/useConfig";
import LanguageSelector from "./LanguageSelector";

const TopBar = () => {
  const { static_black_logo } = useConfig();
  return (
    <div className="bg-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-4">
        <div>
          <a href={"/"}>
            <img
              src={static_black_logo}
              style={{ height: "25px" }}
              alt="care logo"
            />
          </a>
        </div>
        <div>
          <LanguageSelector className="bg-primary-500 text-white" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
