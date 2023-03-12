import { useState, useEffect } from "react";

import loadable from "@loadable/component";
import { useDispatch, useSelector } from "react-redux";
import { getFacilityUsers } from "../../Redux/actions";
const PageTitle = loadable(() => import("../Common/PageTitle"));
import { LiveKit } from "../../Common/LiveKit";
import { get } from "lodash";

const DoctorLiveConnect = (props: { facilityId: string; userId: string }) => {
  const { facilityId, userId } = props;
  const [user, setUser] = useState<any>(null);
  const { currentUser } = useSelector((state) => state) as any;

  const dispatchAction: any = useDispatch();
  useEffect(() => {
    const fetchUsers = async () => {
      if (facilityId) {
        const res = await dispatchAction(getFacilityUsers(facilityId));
        if (res && res.data) {
          setUser(res.data.results.find((user: any) => user.id == userId));
        }
      } else {
        setUser(null);
      }
    };
    fetchUsers();
  }, [facilityId]);

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
                  <LiveKit
                    sourceUsername={get(currentUser, "data.username", "")}
                    targetUsername={user.username}
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
