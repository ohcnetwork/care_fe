import React from "react";
import mahakavachLogo from "../../Common/mahakavach/mahakavachLogo.jpg";

const img = mahakavachLogo;
const TopBar = () => {
  return (
    <div className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto py-4 px-2">
        <div>
          <a href={"/"}>
            <img src={img} style={{ height: "25px" }} alt="care logo" />{" "}
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
