import { Link } from "raviger";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { formatDateTime } from "../../Utils/utils";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";

interface IProps {
  facilityId: string;
}

const TableHeads = [
  "Patient",
  "Status",
  "Created On",
  "Consent Granted On",
  // "Requested By",
  "Health Information Range",
  "Expires On",
  "HI Profiles",
];

export default function ABDMFacilityRecords({ facilityId }: IProps) {
  const { data: consentsResult, loading } = useQuery(routes.listConsents, {
    query: { facility: facilityId, ordering: "-created_date" },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Page title="Patient Consent List">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center"></div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {/* eslint-disable-next-line tailwindcss/migration-from-tailwind-2 */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5  sm:rounded-lg">
                <table className="min-w-full table-fixed divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {TableHeads.map((head) => (
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                        >
                          {head}
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="sticky right-0 top-0 py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {consentsResult?.results.map((consent) => (
                      <tr key={consent.id}>
                        <td className="px-3 py-4 text-center text-sm">
                          {consent.patient_abha_object?.name}
                          <p className="text-gray-600">
                            ({consent.patient_abha})
                          </p>
                        </td>

                        <td className="px-3 py-4 text-center text-sm capitalize">
                          {new Date(
                            consent.consent_artefacts?.[0]?.expiry ??
                              consent.expiry
                          ) < new Date()
                            ? "EXPIRED"
                            : consent.consent_artefacts?.[0]?.status ??
                              consent.status}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(consent.created_date)}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {consent.consent_artefacts.length
                            ? formatDateTime(
                                consent.consent_artefacts[0].created_date
                              )
                            : "-"}
                        </td>

                        {/* <td className="px-3 py-4 text-center text-sm">
                          {`${consent.requester?.first_name} ${consent.requester?.last_name}`.trim()}
                          <p className="text-gray-600">
                            ({consent.requester.username})
                          </p>
                        </td> */}

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.from_time ??
                              consent.from_time
                          )}{" "}
                          <br />
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.to_time ??
                              consent.to_time
                          )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          {formatDateTime(
                            consent.consent_artefacts?.[0]?.expiry ??
                              consent.expiry
                          )}
                        </td>

                        <td className="px-3 py-4 text-center text-sm">
                          <div className="flex flex-wrap items-center justify-center">
                            {(
                              consent.consent_artefacts?.[0]?.hi_types ??
                              consent.hi_types
                            )?.map((hiType) => (
                              <span className="mb-2 mr-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                {hiType}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="sticky right-0 whitespace-nowrap bg-white py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex flex-col items-center justify-center gap-2">
                            {(consent.consent_artefacts?.[0]?.status ??
                              consent.status) === "GRANTED" &&
                            new Date(
                              consent.consent_artefacts?.[0]?.expiry ??
                                consent.expiry
                            ) > new Date() ? (
                              <Link
                                key={consent.id}
                                href={`/abdm/health-information/${consent.id}`}
                                className={
                                  "cursor-pointer text-primary-600 hover:text-primary-900"
                                }
                              >
                                View
                              </Link>
                            ) : (
                              <p className="cursor-not-allowed text-gray-600 opacity-70 ">
                                View
                              </p>
                            )}
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
