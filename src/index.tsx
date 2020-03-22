import React from "react";
import ReactDOM from "react-dom";
import reducer from "../src/Redux/Reducer";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { MuiThemeProvider } from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";
import { StylesProvider } from "@material-ui/styles";
import theme from "./theme";

const store = createStore(reducer, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </MuiThemeProvider>
    </StylesProvider>
  </Provider>,
  document.getElementById("root")
);

serviceWorker.unregister();
