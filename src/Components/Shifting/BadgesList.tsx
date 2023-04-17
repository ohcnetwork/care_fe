import { useState, useEffect } from "react";
import { getUserList, getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { SHIFTING_FILTER_ORDER } from "../../Common/constants";

export default function BadgesList(props: any) {
  const { qParams, FilterBadges } = props;
  const [assignedUsername, setAssignedUsername] = useState("");
  const [assignedFacilityName, setAssignedFacilityName] = useState("");
  const [originFacilityName, setOriginFacilityName] = useState("");
  const [approvingFacilityName, setApprovingFacilityName] = useState("");
  const dispatch: any = useDispatch();
  const { t } = useTranslation();

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
  const getDescShiftingFilterOrder = (ordering: any) => {
    let desc = "";
    SHIFTING_FILTER_ORDER.map((item: any) => {
      if (item.text === ordering) {
        desc = item.desc;
      }
    });
    return desc;
  };
  const filterInitialOption = (fieldValue: any) => {
    if (fieldValue === "--") {
      return "";
    }

    return fieldValue;
  };

  return (
    <FilterBadges
      badges={({ badge, phoneNumber, dateRange, kasp, value }: any) => [
        badge(t("status"), "status"),
        value(
          t("emergency"),
          "emergency",
          filterInitialOption(qParams.emergency)
        ),
        kasp(),
        value(
          t("up_shift"),
          "is_up_shift",
          filterInitialOption(qParams.is_up_shift)
        ),
        value(
          t("antenatal"),
          "is_antenatal",
          filterInitialOption(qParams.is_antenatal)
        ),
        phoneNumber(t("phone_no"), "patient_phone_number"),
        badge(t("patient_name"), "patient_name"),
        ...dateRange(t("created"), "created_date"),
        ...dateRange(t("modified"), "modified_date"),
        badge(t("disease_status"), "disease_status"),
        value(
          t("breathlessness_level"),
          "breathlessness_level",
          filterInitialOption(qParams.breathlessness_level)
        ),
        value(t("assigned_to"), "assigned_to", assignedUsername),
        value(
          t("assigned_facility"),
          "assigned_facility",
          assignedFacilityName
        ),
        value(t("origin_facility"), "orgin_facility", originFacilityName),
        value(
          t("shifting_approval_facility"),
          "shifting_approving_facility",
          approvingFacilityName
        ),
        value(
          t("ordering"),
          "ordering",
          getDescShiftingFilterOrder(qParams.ordering)
        ),
      ]}
    />
  );
}
