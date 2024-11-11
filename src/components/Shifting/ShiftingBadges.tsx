import { useTranslation } from "react-i18next";

import { useFacilityQuery } from "@/components/Resource/ResourceBadges";

import { SHIFTING_FILTER_ORDER } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatName } from "@/Utils/utils";

export default function BadgesList(props: any) {
  const { qParams, FilterBadges } = props;

  const { t } = useTranslation();

  const booleanFilterOptions = {
    trueValue: t("yes"),
    falseValue: t("no"),
  };

  const { data: assignedUser } = useQuery(routes.userList, {
    query: { id: qParams.assigned_to },
    prefetch: !!qParams.assigned_to,
  });
  const originFacility = useFacilityQuery(qParams.origin_facility);
  const approvingFacility = useFacilityQuery(
    qParams.shifting_approving_facility,
  );
  const assignedFacility = useFacilityQuery(qParams.assigned_facility);

  const getDescShiftingFilterOrder = (ordering: any) => {
    const foundItem = SHIFTING_FILTER_ORDER.find(
      (item) => item.text === ordering,
    );
    return foundItem ? foundItem.desc : "";
  };

  return (
    <FilterBadges
      badges={({ badge, phoneNumber, dateRange, kasp, value }: any) => [
        badge(t("status"), "status"),
        badge(t("emergency"), "emergency", booleanFilterOptions),
        kasp(),
        badge(t("up_shift"), "is_up_shift", booleanFilterOptions),
        badge(t("antenatal"), "is_antenatal", booleanFilterOptions),
        phoneNumber(t("phone_no"), "patient_phone_number"),
        badge(t("patient_name"), "patient_name"),
        ...dateRange(t("created"), "created_date"),
        ...dateRange(t("modified"), "modified_date"),
        badge(t("breathlessness_level"), "breathlessness_level"),
        value(
          t("assigned_to"),
          "assigned_to",
          qParams.assigned_to
            ? assignedUser?.results[0] && formatName(assignedUser?.results[0])
            : "",
        ),
        value(
          t("assigned_facility"),
          "assigned_facility",
          qParams.assigned_facility ? assignedFacility?.data?.name || "" : "",
        ),
        value(
          t("origin_facility"),
          "origin_facility",
          qParams.origin_facility ? originFacility?.data?.name || "" : "",
        ),
        value(
          t("shifting_approval_facility"),
          "shifting_approving_facility",
          qParams.shifting_approving_facility
            ? approvingFacility?.data?.name || ""
            : "",
        ),
        value(
          t("ordering"),
          "ordering",
          getDescShiftingFilterOrder(qParams.ordering),
        ),
      ]}
    />
  );
}
