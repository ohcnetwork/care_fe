import Auth from "./Auth.json";
import Asset from "./Asset.json";
import Common from "./Common.json";
import Consultation from "./Consultation.json";
import Entities from "./Entities.json";
import Facility from "./Facility.json";
import Hub from "./Hub.json";
import ErrorPages from "./ErrorPages.json";
import Shifting from "./Shifting.json";
import Notifications from "./Notifications.json";
import ExternalResult from "./ExternalResult.json";
import CoverImageEdit from "./CoverImageEdit.json";
import Resource from "./Resource.json";
import SortOptions from "./SortOptions.json";
import Bed from "./Bed.json";
import Medicine from "./Medicine.json";

export default {
  ...Auth,
  ...Asset,
  ...Common,
  ...Consultation,
  ...CoverImageEdit,
  ...Entities,
  ...ErrorPages,
  ...ExternalResult,
  ...Facility,
  ...Hub,
  ...Medicine,
  ...Notifications,
  ...Resource,
  ...Shifting,
  ...Bed,
  SortOptions,
};
