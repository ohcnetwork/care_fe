import React from "react";

function ClosingTag() {
  return (
    <span className="cursor-pointer font-glight">
      <svg
        v-else-if="name === 'close'"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-pointer"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </span>
  );
}

export default ClosingTag;
