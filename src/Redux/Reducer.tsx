import { IConfig } from "../Common/hooks/useConfig";
import { actions } from "./fireRequest";

export const getCachedConfig = () => {
  const localConfig = localStorage.getItem("config");
  if (localConfig) {
    try {
      const config = JSON.parse(localConfig) as IConfig;
      return config;
    } catch (_) {
      return undefined;
    }
  }
};

const cachedConfig = getCachedConfig();

const reducer = (
  state = {
    config: cachedConfig,
  },
  changeAction: any
) => {
  switch (changeAction.type) {
    case actions.FETCH_REQUEST: {
      const obj: any = Object.assign({}, state);
      obj[changeAction.key] = {
        isFetching: true,
        error: false,
      };
      return obj;
    }
    case actions.FETCH_REQUEST_SUCCESS: {
      const obj: any = Object.assign({}, state);
      obj[changeAction.key] = {
        isFetching: false,
        error: false,
        data: changeAction.data,
      };
      return obj;
    }
    case actions.FETCH_REQUEST_ERROR: {
      const obj: any = Object.assign({}, state);
      obj[changeAction.key] = {
        isFetching: false,
        error: true,
        errorMessage: changeAction.error,
      };
      return obj;
    }

    case actions.SET_DATA: {
      const obj: any = Object.assign({}, state);
      obj[changeAction.key] = changeAction.value;
      return obj;
    }

    default:
      return state;
  }
};
export default reducer;
