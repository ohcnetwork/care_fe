import React from "react";
const img = "https://cdn.coronasafe.network/light-logo.svg";
const Loading = () => {
  return (
    <div className="grid">
      <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 flex justify-center items-center">
        <div className="App">
          <header className="App-header">
            <img src={img} className="App-logo" alt="logo" />
          </header>
        </div>
      </div>
    </div>
  );
};
export default Loading;
