import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import { LocationSelect } from "@/components/Common/LocationSelect";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { SortOption } from "@/components/Common/SortDropdown";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import HL7PatientVitalsMonitor from "@/components/VitalsMonitor/HL7PatientVitalsMonitor";
import useVitalsAspectRatioConfig from "@/components/VitalsMonitor/useVitalsAspectRatioConfig";
import { getVitalsMonitorSocketUrl } from "@/components/VitalsMonitor/utils";

import useFilters from "@/hooks/useFilters";
import useFullscreen from "@/hooks/useFullscreen";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

const PER_PAGE_LIMIT = 6;

const SORT_OPTIONS: SortOption[] = [
  { isAscending: true, value: "bed__name" },
  { isAscending: false, value: "-bed__name" },
  { isAscending: false, value: "-created_date" },
  { isAscending: true, value: "created_date" },
];

interface Props {
  facilityId: string;
}

export default function CentralNursingStation({ facilityId }: Props) {
  const { t } = useTranslation();
  const [isFullscreen, setFullscreen] = useFullscreen();
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: PER_PAGE_LIMIT,
  });
  const query = useQuery(routes.listPatientAssetBeds, {
    pathParams: { facility_external_id: facilityId },
    query: {
      ...qParams,
      page: qParams.page || 1,
      limit: PER_PAGE_LIMIT,
      offset: (qParams.page ? qParams.page - 1 : 0) * PER_PAGE_LIMIT,
      asset_class: "HL7MONITOR",
      ordering: qParams.ordering || "bed__name",
      bed_is_occupied:
        qParams.monitors_without_patient === "true" ? undefined : "true",
    },
  });

  const totalCount = query.data?.count ?? 0;
  const data = query.data?.results.map((obj) => ({
    patientAssetBed: obj,
    socketUrl: getVitalsMonitorSocketUrl(obj.asset),
  }));

  const { config, hash } = useVitalsAspectRatioConfig({
    default: 6 / 11,
    sm: 17 / 11,
    md: 19 / 11,
    lg: 11 / 11,
    xl: 13 / 11,
    "2xl": 16 / 11,
    "3xl": 12 / 11,
  });

  return (
    <Page
      title="Central Nursing Station"
      backUrl={`/facility/${facilityId}/`}
      noImplicitPadding
      breadcrumbs={false}
      collapseSidebar
      options={
        <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
          <Pagination
            className=""
            cPage={qParams.page}
            defaultPerPage={PER_PAGE_LIMIT}
            data={{ totalCount }}
            onChange={(page) => updatePage(page)}
          />
          <Popover className="relative">
            <PopoverButton>
              <ButtonV2
                variant={
                  qParams.location ||
                  qParams.monitors_without_patient === "true"
                    ? "primary"
                    : "secondary"
                }
                border
              >
                <CareIcon icon="l-setting" className="text-lg" />
                {t("settings_and_filters")}
              </ButtonV2>
            </PopoverButton>
            <Transition
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel className="absolute z-30 mt-1 w-80 -translate-x-1/3 px-4 sm:px-0 md:w-96 md:-translate-x-1/2 lg:max-w-3xl">
                <div className="rounded-lg shadow-lg ring-1 ring-secondary-400">
                  <div className="rounded-t-lg bg-secondary-100 px-6 py-4">
                    <div className="flow-root rounded-md">
                      <span className="block text-sm text-secondary-800">
                        <span className="font-bold">{totalCount}</span>{" "}
                        {t("vitals_present")}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex flex-col gap-8 rounded-b-lg bg-white p-6">
                    <div>
                      <FieldLabel className="text-sm">
                        Filter by Location
                      </FieldLabel>
                      <div>
                        <LocationSelect
                          key={qParams.location}
                          name="Facilities"
                          setSelected={(location) => {
                            location
                              ? updateQuery({ location })
                              : removeFilter("location");
                          }}
                          selected={qParams.location}
                          showAll={false}
                          multiple={false}
                          facilityId={facilityId}
                          errors=""
                          errorClassName="hidden"
                          bedIsOccupied={JSON.parse(
                            qParams.monitors_without_patient ?? "false",
                          )}
                          disableOnOneOrFewer
                        />
                      </div>
                    </div>
                    <SelectFormField
                      name="ordering"
                      label={t("sort_by")}
                      required
                      value={qParams.ordering || "bed__name"}
                      onChange={({ value }) => updateQuery({ ordering: value })}
                      options={SORT_OPTIONS}
                      optionLabel={({ value }) => t("SORT_OPTIONS__" + value)}
                      optionIcon={({ isAscending }) => (
                        <CareIcon
                          icon={
                            isAscending
                              ? "l-sort-amount-up"
                              : "l-sort-amount-down"
                          }
                        />
                      )}
                      optionValue={({ value }) => value}
                      labelClassName="text-sm"
                      errorClassName="hidden"
                    />
                    <CheckBoxFormField
                      name="monitors_without_patient"
                      label="Include monitors without patient"
                      value={JSON.parse(
                        qParams.monitors_without_patient ?? "false",
                      )}
                      onChange={(e) =>
                        updateQuery({ [e.name]: `${e.value}`, location: "" })
                      }
                      labelClassName="text-sm"
                      errorClassName="hidden"
                    />
                    <ButtonV2
                      variant="secondary"
                      border
                      onClick={() => setFullscreen(!isFullscreen)}
                      className="tooltip !h-11"
                    >
                      <CareIcon
                        icon={
                          isFullscreen
                            ? "l-compress-arrows"
                            : "l-expand-arrows-alt"
                        }
                        className="text-lg"
                      />
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </ButtonV2>
                  </div>
                </div>
              </PopoverPanel>
            </Transition>
          </Popover>
        </div>
      }
    >
      {data === undefined || query.loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-black">
          {t("no_vitals_present")}
        </div>
      ) : (
        <div className="3xl:grid-cols-3 mt-1 grid grid-cols-1 gap-1 lg:grid-cols-2">
          {data.map((props, i) => (
            <div className="overflow-hidden text-clip" key={i}>
              <HL7PatientVitalsMonitor
                patientCurrentBedAssignmentDate={
                  props.patientAssetBed?.patient?.last_consultation?.current_bed
                    ?.start_date
                }
                key={`${props.patientAssetBed?.bed.id}-${hash}`}
                patientAssetBed={props.patientAssetBed}
                socketUrl={props.socketUrl || ""}
                config={config}
              />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
