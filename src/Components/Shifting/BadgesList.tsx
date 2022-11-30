import { useState, useEffect } from "react";
import { getUserList, getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";

const booleanFilterOptions = {
  trueValue: "yes",
  falseValue: "no",
};

export default function BadgesList(props: any) {
  const { qParams, FilterBadges } = props;
  const [assignedUsername, setAssignedUsername] = useState("");
  const [assignedFacilityName, setAssignedFacilityName] = useState("");
  const [originFacilityName, setOriginFacilityName] = useState("");
  const [approvingFacilityName, setApprovingFacilityName] = useState("");
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (!qParams.assigned_to) return setAssignedUsername("");
      const res = await dispatch(getUserList({ id: qParams.assigned_to }));
      const { first_name, last_name } = res?.data?.results[0];
      setAssignedUsername(`${first_name} ${last_name}`);
    }
    fetchData();
  }, [dispatch, qParams.assigned_to]);

  useEffect(() => {
    async function fetchData() {
      if (!qParams.orgin_facility) return setOriginFacilityName("");
      const res = await dispatch(
        getAnyFacility(qParams.orgin_facility, "orgin_facility")
      );
      setOriginFacilityName(res?.data?.name);
    }
    fetchData();
  }, [dispatch, qParams.orgin_facility]);

  useEffect(() => {
    async function fetchData() {
      if (!qParams.shifting_approving_facility)
        return setApprovingFacilityName("");
      const res = await dispatch(
        getAnyFacility(
          qParams.shifting_approving_facility,
          "shifting_approving_facility"
        )
      );
      setApprovingFacilityName(res?.data?.name);
    }
    fetchData();
  }, [dispatch, qParams.shifting_approving_facility]);

  useEffect(() => {
    async function fetchData() {
      if (!qParams.assigned_facility) return setAssignedFacilityName("");
      const res = await dispatch(
        getAnyFacility(qParams.assigned_facility, "assigned_facility")
      );
      setAssignedFacilityName(res?.data?.name);
    }
    fetchData();
  }, [dispatch, qParams.assigned_facility]);

  return (
    <FilterBadges
      badges={({
        badge,
        boolean,
        phoneNumber,
        dateRange,
        kasp,
        value,
      }: any) => [
        badge("Status", "status"),
        boolean("Emergency", "emergency", booleanFilterOptions),
        kasp(),
        boolean("Up shift", "is_up_shift", booleanFilterOptions),
        boolean("Antenatal", "is_antenatal", booleanFilterOptions),
        phoneNumber("Phone no.", "patient_phone_number"),
        badge("Patient name", "patient_name"),
        ...dateRange("Created", "created_date"),
        badge("Disease status", "disease_status"),
        badge("Breathlessness level", "breathlessness_level"),
        value("Assigned to", "assigned_to", assignedUsername),
        value("Facility assigned", "assigned_facility", assignedFacilityName),
        value("Origin facility", "orgin_facility", originFacilityName),
        value(
          "Shifting approval facility",
          "shifting_approving_facility",
          approvingFacilityName
        ),
      ]}
    />
  );
}
