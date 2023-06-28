import { useState } from "react";

export default function useMergeState(initialState) {
  const [state, setState] = useState(initialState);

  const setMergedState = (newState) =>
    setState((prevState) => Object.assign({}, prevState, newState));

  return [state, setMergedState];
}
