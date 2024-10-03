'use client'
import { useState, CSSProperties } from "react";
import BeatLoader from "react-spinners/BeatLoader";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "red",
};

function LoadingComponent() {
  let [loading, setLoading] = useState(true);
  let [color, setColor] = useState("#ffffff");

  return (
    <div className="flex justify-center items-center w-screen h-screen">

      <BeatLoader
        color={"navy"}
        loading={loading}
        cssOverride={override}
        size={15}
        aria-label="Loading Spinner"
        data-testid="loader"
      />


    </div>
  );
}

export default LoadingComponent;
