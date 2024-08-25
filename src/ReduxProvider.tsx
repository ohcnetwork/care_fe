"use client";

import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import reducer from "./Redux/Reducer"; // Adjust path as needed

// Initialize Redux store
const store = createStore(reducer, applyMiddleware(thunk));

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
