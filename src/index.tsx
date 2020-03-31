import React from 'react';
import ReactDOM from 'react-dom';
import reducer from '../src/Redux/Reducer';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {applyMiddleware, createStore} from "redux";
import thunk from "redux-thunk";
import {Provider} from "react-redux";
import * as Sentry from '@sentry/browser';

const store = createStore(reducer, applyMiddleware(thunk));

Sentry.init({dsn: "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632"});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

serviceWorker.unregister();
