import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDateTime } from "@/Utils/utils";

interface IProps {
  facilityId: string;
}

const TableHeads = [
  "consent__patient",
  "consent__status",
  "created_on",
  "updated_on",
  "consent__hi_range",
  "expires_on",
  "consent__hi_types",
];

export default function ABDMFacilityRecords({ facilityId }: IProps) {
  const { t } = useTranslation();

  const {
    data: consentsResult,
    loading,
    refetch,
  } = useQuery(routes.abdm.consent.list, {
    query: { facility: facilityId, ordering: "-created_date" },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Page title={t("facility_consent_requests_page_title")}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center"></div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full table-fixed divide-y divide-secondary-300">
                  <thead className="bg-secondary-50">
                    <tr>
                      {TableHeads.map((head) => (
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-center text-sm font-semibold text-secondary-900"
                        >
                          {t(head)}
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="sticky right-0 top-0 py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <ButtonV2
                          onClick={() => refetch()}
                          ghost
                          className="max-w-2xl text-sm text-secondary-700 hover:text-secondary-900"
                        >
                          <CareIcon icon="l-refresh" /> {t("refresh")}
                        </ButtonV2>
                        <span className="sr-only">{t("view")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 bg-white">
                    {consentsResult?.results.map((consent) => (
                      <tr key={consent.id}>
                        <td className="px-3 py-4 text-center text-sm">
                          {consent.patient_abha_object?.name}
                          <p className="text-secondary-600">
                            ({consent.patient_abha})
                          </p>
                        </td>

                        <td className="px-3 py-4 text-center text-sm capitalize">
                          {new Date(
                            consent.consent_artefacts?.[0]?.expiry ??
                              consent.expiry,
                          ) < new Date()
                            ? t("consent__status__EXPIRED")
                            : t(
                                `consent__status__${
                                  consent.consent_artefacts?.[0]?.status ??
                                  consent.status
                                }`,
                              )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(consent.created_date)}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {consent.status === "EXPIRED" ||
                          new Date(
                            consent.consent_artefacts?.[0]?.expiry ??
                              consent.expiry,
                          ) < new Date() ? (
                            <p className="flex flex-col items-center gap-1">
                              {formatDateTime(
                                consent.consent_artefacts?.[0]?.expiry ??
                                  consent.expiry,
                              )}
                              <span className="text-sm text-secondary-600">
                                {t("expired_on")}
                              </span>
                            </p>
                          ) : consent.status === "REQUESTED" ? (
                            "-"
                          ) : (
                            <p className="flex flex-col items-center gap-1">
                              {formatDateTime(consent.modified_date)}
                              <span className="text-sm text-secondary-600">
                                {t(`${consent.status.toLowerCase()}_on`)}
                              </span>
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.from_time ??
                              consent.from_time,
                          )}{" "}
                          <br />
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.to_time ??
                              consent.to_time,
                          )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.expiry ??
                              consent.expiry,
                          )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          <div className="flex flex-wrap items-center justify-center">
                            {(
                              consent.consent_artefacts?.[0]?.hi_types ??
                              consent.hi_types
                            )?.map((hiType) => (
                              <span className="mb-2 mr-2 rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-600">
                                {t(`consent__hi_type__${hiType}`)}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="sticky right-0 whitespace-nowrap bg-white py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Link
                              key={consent.id}
                              href={`/abdm/health-information/${consent.id}`}
                              className={classNames(
                                (consent.consent_artefacts?.[0]?.status ??
                                  consent.status) === "GRANTED" &&
                                  new Date(
                                    consent.consent_artefacts?.[0]?.expiry ??
                                      consent.expiry,
                                  ) > new Date()
                                  ? "cursor-pointer text-primary-600 hover:text-primary-900"
                                  : "pointer-events-none cursor-not-allowed text-secondary-600 opacity-70",
                              )}
                            >
                              {t("view")}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
