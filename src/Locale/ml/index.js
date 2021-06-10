import Auth from "./Auth.json";
import Common from "./Common.json";
import Entities from "./Entities.json";
import Facility from "./Facility.json";
import Patient from "./Patient.json";

export default {
    ...Auth,
    ...Common,
    ...Entities,
    ...Facility,
    ...Patient
}