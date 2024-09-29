import { Livekit } from "../Common/Livekit";
import loadable from "@loadable/component";
import routes from "../../Redux/api";
import useAuthUser from "../../Common/hooks/useAuthUser";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";

const PageTitle = loadable(() => import("../Common/PageTitle"));

const DoctorLiveConnect = (props: { facilityId: string; userId: string }) => {
  const { facilityId, userId } = props;
  const [user, setUser] = useState<any>(null);
  const currentUser = useAuthUser();

  useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: facilityId },
    query: { limit: 50 },
    onResponse: (res) => {
      setUser(res.data?.results.find((user: any) => user.id == userId));
    },
  });

  return (
    user && (
      <div className="px-2 pb-2">
        <PageTitle title="Doctor Live Connect" />
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="bg-white rounded-lg md:rounded-xl w-full flex service-panel">
            <div className="w-full md:p-8 md:pt-6 p-6 pt-4 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl md:text-3xl font-bold break-words">
                      Connect to Doctor {user.first_name} {user.last_name}
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <Livekit
                    sourceUsername={currentUser.username}
                    targetUsername={
                      user.username === currentUser.username
                        ? "devdistrictadmin"
                        : user.username
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorLiveConnect;
