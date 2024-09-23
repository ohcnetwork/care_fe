import { useLayoutEffect, useRef, useState } from "react";

import CareIcon from "../../CAREUI/icons/CareIcon";
import ClaimCardCommunication from "./ClaimCardCommunication";
import ClaimCardInfo from "./ClaimCardInfo";
import { HCXClaimModel } from "./models";

interface IProps {
  claim: HCXClaimModel;
}

export default function ClaimCard({ claim }: IProps) {
  const [showMessages, setShowMessages] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (cardContainerRef.current) {
      setContainerDimensions({
        width: cardContainerRef.current.offsetWidth,
        height: cardContainerRef.current.offsetHeight,
      });
    }
  }, [cardContainerRef]);

  return (
    <>
      <div className="relative flex justify-end">
        <CareIcon
          icon={showMessages ? "l-info-circle" : "l-chat"}
          className="absolute right-0 top-0 z-30 h-7 w-7 cursor-pointer text-gray-600 hover:text-gray-800"
          onClick={() => setShowMessages((prev) => !prev)}
        />
      </div>
      {showMessages ? (
        <div
          style={{ ...containerDimensions }}
          className="relative w-full px-2 lg:px-8"
        >
          <ClaimCardCommunication claim={claim} />
        </div>
      ) : (
        <div
          ref={cardContainerRef}
          className="w-full px-2 lg:px-8" // TODO: add a card flip animation
        >
          <ClaimCardInfo claim={claim} />
        </div>
      )}
    </>
  );
}
