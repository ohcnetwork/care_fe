import React from "react";
import ReactDOM from "react-dom";
import reducer from "../src/Redux/Reducer";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import * as Sentry from "@sentry/browser";
import "./index.css";

const store = createStore(reducer, applyMiddleware(thunk));

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632"
});

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#0e9f6e',
    },
  },
});

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </Provider>,
  document.getElementById("root")
);

serviceWorker.unregister();
