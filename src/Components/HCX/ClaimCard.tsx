import { useLayoutEffect, useRef, useState } from "react";

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

  console.log(containerDimensions);

  return showMessages ? (
    <div style={{ ...containerDimensions }} className="px-6 lg:px-8 relative">
      <ClaimCardCommunication claim={claim} setShowMessages={setShowMessages} />
    </div>
  ) : (
    <div
      ref={cardContainerRef}
      className="px-6 lg:px-8" // TODO: add a card flip animation
    >
      <ClaimCardInfo claim={claim} setShowMessages={setShowMessages} />
    </div>
  );
}
