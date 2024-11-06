import { HIProfile } from "hi-profiles";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

interface IProps {
  artefactId: string;
}

export default function HealthInformation({ artefactId }: IProps) {
  const { t } = useTranslation();

  const { data, loading, error } = useQuery(routes.abdm.healthInformation.get, {
    pathParams: { artefactId },
    silent: true,
  });

  if (loading) {
    return <Loading />;
  }

  const parseData = (data: string) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return JSON.parse(
        data.replace(/"/g, '\\"').replace(/'/g, '"'), // eslint-disable-line
      );
    }
  };

  return (
    <Page title={t("hi__page_title")}>
      <div className="mt-10 flex flex-col items-center justify-center gap-6">
        {!!error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-secondary-700">
              {t("hi__record_archived__title")}
            </h3>
            <h5 className="mt-2 text-sm text-secondary-500">
              {t("hi__record_archived_description")}
            </h5>
            <h4 className="mt-2 text-center text-secondary-500">
              {t("hi__record_archived_on")}{" "}
              {new Date(error?.archived_time as string).toLocaleString()} -{" "}
              {error?.archived_reason as string}
            </h4>
          </>
        )}
        {error && !error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-secondary-700">
              {t("hi__record_not_fetched_title")}
            </h3>
            <h5 className="mt-2 text-sm text-secondary-500">
              {t("hi__record_not_fetched_description")}
            </h5>
            <h4 className="mt-2 text-secondary-500">
              {t("hi__waiting_for_record")}
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
