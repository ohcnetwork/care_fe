import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Loading from "../Common/Loading";
import Page from "../Common/components/Page";
import { HIProfile } from "hi-profiles";

interface IProps {
  artefactId: string;
}

export default function HealthInformation({ artefactId }: IProps) {
  const { data, loading, error } = useQuery(routes.getHealthInformation, {
    pathParams: { artefactId },
    silent: true,
  });

  if (loading) {
    return <Loading />;
  }

  const parseData = (data: any) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return JSON.parse(
        data.replace(/"/g, '\\"').replace(/'/g, '"') // eslint-disable-line
      );
    }
  };

  return (
    <Page title="Health Information">
      <div className="mt-10 flex flex-col items-center justify-center gap-6">
        {!!error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-gray-700">
              This record has been archived
            </h3>
            <h5 className="mt-2 text-sm text-gray-500">
              This record has been archived and is no longer available for
              viewing.
            </h5>
            <h4 className="mt-2 text-center text-gray-500">
              This record was archived on{" "}
              {new Date(error?.archived_time as string).toLocaleString()} as{" "}
              {error?.archived_reason as string}
            </h4>
          </>
        )}
        {error && !error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-gray-700">
              This record hasn't been fetched yet
            </h3>
            <h5 className="mt-2 text-sm text-gray-500">
              This record hasn't been fetched yet. Please try again later.
            </h5>
            <h4 className="mt-2 text-gray-500">
              Waiting for the HIP to send the record.
            </h4>
          </>
        )}
        {data?.data.map((item) => (
          <HIProfile
            key={item.care_context_reference}
            bundle={parseData(item.content)}
          />
        ))}
      </div>
    </Page>
  );
}
