import { useDispatch } from "react-redux";
import useFullscreen from "../../Common/hooks/useFullscreen";
import { Fragment, useContext, useEffect, useState } from "react";
import {
  getPermittedFacility,
  listPatientAssetBeds,
} from "../../Redux/actions";
import HL7PatientVitalsMonitor from "../VitalsMonitor/HL7PatientVitalsMonitor";
import useFilters from "../../Common/hooks/useFilters";
import { FacilityModel } from "./models";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { LocationSelect } from "../Common/LocationSelect";
import Pagination from "../Common/Pagination";
import { SidebarShrinkContext } from "../Common/Sidebar/Sidebar";
import { PatientAssetBed } from "../Assets/AssetTypes";
import { Popover, Transition } from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { useTranslation } from "react-i18next";
import { SortOption } from "../Common/SortDropdown";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import useVitalsAspectRatioConfig from "../VitalsMonitor/useVitalsAspectRatioConfig";

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
  const dispatch = useDispatch<any>();
  const [isFullscreen, setFullscreen] = useFullscreen();
  const sidebar = useContext(SidebarShrinkContext);

  const [facilityObject, setFacilityObject] = useState<FacilityModel>();
  const [data, setData] =
    useState<Parameters<typeof HL7PatientVitalsMonitor>[0][]>();
  const [totalCount, setTotalCount] = useState(0);
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: PER_PAGE_LIMIT,
  });

  // To automatically collapse sidebar.
  useEffect(() => {
    sidebar.setShrinked(true);

    return () => {
      sidebar.setShrinked(sidebar.shrinked);
    };
  }, []);

  useEffect(() => {
    async function fetchFacilityOrObject() {
      if (facilityObject) return facilityObject;
      const res = await dispatch(getPermittedFacility(facilityId));
      if (res.status !== 200) return;
      setFacilityObject(res.data);
      return res.data as FacilityModel;
    }

    async function fetchData() {
      setData(undefined);

      const filters = {
        ...qParams,
        page: qParams.page || 1,
        limit: PER_PAGE_LIMIT,
        offset: (qParams.page ? qParams.page - 1 : 0) * PER_PAGE_LIMIT,
        asset_class: "HL7MONITOR",
        ordering: qParams.ordering || "bed__name",
        bed_is_occupied: qParams.bed_is_occupied ?? true,
      };

      const [facilityObj, res] = await Promise.all([
        fetchFacilityOrObject(),
        dispatch(listPatientAssetBeds(facilityId, filters)),
      ]);

      if (!facilityObj || res.status !== 200) {
        return;
      }

      const entries = res.data.results as PatientAssetBed[];

      setTotalCount(res.data.count);
      setData(
        entries.map(({ patient, asset, bed }) => {
          const middleware =
            asset.meta?.middleware_hostname || facilityObj?.middleware_address;
          const local_ip_address = asset.meta?.local_ip_address;

          return {
            patientAssetBed: { patient, asset, bed },
            socketUrl: `wss://${middleware}/observations/${local_ip_address}`,
          };
        })
      );
    }
    fetchData();
  }, [
    dispatch,
    facilityId,
    qParams.page,
    qParams.location,
    qParams.ordering,
    qParams.bed_is_occupied,
  ]);

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
                      <div className="flex w-full items-center gap-2">
                        <LocationSelect
                          key={qParams.location}
                          name="Facilities"
                          setSelected={(location) => updateQuery({ location })}
                          selected={qParams.location}
                          showAll={false}
                          multiple={false}
                          facilityId={facilityId}
                          errors=""
                          errorClassName="hidden"
                        />
                        {qParams.location && (
                          <ButtonV2
                            variant="secondary"
                            circle
                            border
                            onClick={() => removeFilter("location")}
                          >
                            Clear
                          </ButtonV2>
                        )}
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
                      name="bed_is_occupied"
                      label="Hide Monitors without Patient"
                      value={
                        qParams.bed_is_occupied === "true" ||
                        qParams.bed_is_occupied === undefined
                      }
                      onChange={({ name, value }) => {
                        if (value) {
                          updateQuery({ [name]: value });
                        } else {
                          removeFilter(name);
                        }
                      }}
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
      {data === undefined ? (
        <Loading />
      ) : data.length === 0 ? (
        <div className="flex h-[80vh] w-full items-center justify-center text-center text-black">
          No Vitals Monitor present in this location or facility.
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-1 gap-1 lg:grid-cols-2 3xl:grid-cols-3">
          {data.map((props) => (
            <div className="overflow-hidden text-clip">
              <HL7PatientVitalsMonitor
                key={`${props.patientAssetBed?.bed.id}-${hash}`}
                {...props}
                config={config}
              />
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
