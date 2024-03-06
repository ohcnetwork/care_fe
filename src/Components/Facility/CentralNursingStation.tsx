import useFullscreen from "../../Common/hooks/useFullscreen";
import { Fragment } from "react";
import HL7PatientVitalsMonitor from "../VitalsMonitor/HL7PatientVitalsMonitor";
import useFilters from "../../Common/hooks/useFilters";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { LocationSelect } from "../Common/LocationSelect";
import Pagination from "../Common/Pagination";
import { Popover, Transition } from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { useTranslation } from "react-i18next";
import { SortOption } from "../Common/SortDropdown";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import useVitalsAspectRatioConfig from "../VitalsMonitor/useVitalsAspectRatioConfig";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { getVitalsMonitorSocketUrl } from "../VitalsMonitor/utils";

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
        (qParams.hide_monitors_without_patient ?? "true") === "true",
    },
  });

  const totalCount = query.data?.count ?? 0;
  const data = query.data?.results.map((obj) => ({
    patientAssetBed: obj,
    socketUrl: getVitalsMonitorSocketUrl(obj.asset),
  }));

  const { config, hash } = useVitalsAspectRatioConfig({
    default: 6 / 11,
    vs: 10 / 11,
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
          <Popover className="relative">
            <Popover.Button>
              <ButtonV2 variant="secondary" border>
                <CareIcon className="care-l-setting text-lg" />
                Settings and Filters
              </ButtonV2>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-30 mt-1 w-80 -translate-x-1/3 px-4 sm:px-0 md:w-96 md:-translate-x-1/2 lg:max-w-3xl">
                <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
                  <div className="rounded-t-lg bg-gray-100 px-6 py-4">
                    <div className="flow-root rounded-md">
                      <span className="block text-sm text-gray-800">
                        <span className="font-bold ">{totalCount}</span> Vitals
                        Monitor present
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
                      optionLabel={({ value }) => t("SortOptions." + value)}
                      optionIcon={({ isAscending }) => (
                        <CareIcon
                          className={
                            isAscending
                              ? "care-l-sort-amount-up"
                              : "care-l-sort-amount-down"
                          }
                        />
                      )}
                      optionValue={({ value }) => value}
                      labelClassName="text-sm"
                      errorClassName="hidden"
                    />
                    <CheckBoxFormField
                      name="hide_monitors_without_patient"
                      label="Hide Monitors without Patient"
                      value={JSON.parse(
                        qParams.hide_monitors_without_patient ?? true
                      )}
                      onChange={(e) => updateQuery({ [e.name]: e.value })}
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
                        className={classNames(
                          isFullscreen
                            ? "care-l-compress-arrows"
                            : "care-l-expand-arrows-alt",
                          "text-lg"
                        )}
                      />
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </ButtonV2>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <Pagination
            className=""
            cPage={qParams.page}
            defaultPerPage={PER_PAGE_LIMIT}
            data={{ totalCount }}
            onChange={(page) => updatePage(page)}
          />
        </div>
      }
    >
      {data === undefined || query.loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-black">
          No Vitals Monitor present in this location or facility.
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-1 gap-1 lg:grid-cols-2 3xl:grid-cols-3">
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
