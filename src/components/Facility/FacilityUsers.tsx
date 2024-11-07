import { useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import UserDetails from "@/components/Common/UserDetails";
import LinkFacilityDialog from "@/components/Users/LinkFacilityDialog";
import { UserFacilities } from "@/components/Users/ManageUsers";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { formatName, isUserOnline, relativeTime } from "@/Utils/utils";

export default function FacilityUsers(props: any) {
  const { t } = useTranslation();
  const { facilityId } = props;
  let manageUsers: any = null;
  const [isAddFacilityLoading, setIsAddFacilityLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandFacilityList, setExpandFacilityList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [offset, setOffset] = useState(0);

  const [linkFacility, setLinkFacility] = useState<{
    show: boolean;
    username: string;
  }>({ show: false, username: "" });

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const limit = RESULTS_PER_PAGE_LIMIT;

  const { data: facilityData } = useQuery(routes.getAnyFacility, {
    pathParams: {
      id: facilityId,
    },
    prefetch: facilityId !== undefined,
  });

  const {
    data: facilityUserData,
    refetch: facilityUserFetch,
    loading: isLoading,
  } = useQuery(routes.getFacilityUsers, {
    query: { offset: offset, limit: limit },
    pathParams: { facility_id: facilityId },
    prefetch: facilityId !== undefined,
  });

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const loadFacilities = async (username: string) => {
    if (isAddFacilityLoading) {
      return;
    }
    const { res, data } = await request(routes.userListFacility, {
      pathParams: { username: username },
    });
    if (res?.ok && data && facilityUserData) {
      facilityUserData.results = facilityUserData.results.map((user) => {
        return user.username === username
          ? {
              ...user,
              facilities: data,
            }
          : user;
      });
    }
  };

  const hideLinkFacilityModal = () => {
    setLinkFacility({
      show: false,
      username: "",
    });
  };

  const handleCancel = () => {
    setUserData({ show: false, username: "", name: "" });
  };

  const handleSubmit = async () => {
    const username = userData.username;
    await request(routes.deleteUser, {
      pathParams: { username: username },
      onResponse: ({ res }) => {
        if (res?.status === 204) {
          Notification.Success({
            msg: t("user_deleted_successfuly"),
          });
        }
      },
    });
    setUserData({ show: false, username: "", name: "" });
    facilityUserFetch();
  };

  const addFacility = async (username: string, facility: any) => {
    hideLinkFacilityModal();
    setIsAddFacilityLoading(true);
    // Remaining props of request are not specified in dispatch request
    await request(routes.addUserFacility, {
      body: {
        facility: String(facility.id),
      },
      pathParams: {
        username: username,
      },
    });
    setIsAddFacilityLoading(false);
    loadFacilities(username);
  };

  let userList: any[] = [];

  facilityUserData &&
    facilityUserData.results &&
    facilityUserData.results.length &&
    (userList = facilityUserData.results.map((user) => {
      return (
        <div
          key={`usr_${user.id}`}
          className="mt-6 w-full md:px-4 lg:w-1/2 xl:w-1/3"
        >
          <div className="block h-full cursor-pointer overflow-hidden rounded-lg bg-white shadow hover:border-primary-500">
            <div className="flex h-full flex-col justify-between">
              <div className="px-6 py-4">
                <div className="flex flex-col justify-between lg:flex-row">
                  {user.username && (
                    <div
                      id="user-view-name"
                      className="inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-blue-800"
                    >
                      {user.username}
                    </div>
                  )}
                  <div className="min-width-50 shrink-0 text-sm text-secondary-600">
                    {t("last_online")}{" "}
                    <span
                      aria-label="Online"
                      className={
                        "inline-block h-2 w-2 shrink-0 rounded-full " +
                        (isUserOnline(user)
                          ? "bg-primary-400"
                          : "bg-secondary-300")
                      }
                    ></span>
                    <span className="pl-2">
                      {user.last_login
                        ? relativeTime(user.last_login)
                        : t("never")}
                    </span>
                  </div>
                </div>
                <div
                  id="name"
                  className="mt-2 flex gap-3 text-2xl font-bold capitalize"
                >
                  {formatName(user)}
                </div>

                <div className="flex justify-between">
                  {user.user_type && (
                    <UserDetails title="Role">
                      <div className="font-semibold">{user.user_type}</div>
                    </UserDetails>
                  )}
                </div>
                <div className="flex justify-between">
                  {user.phone_number && (
                    <div className="mt-2 border-t bg-secondary-50 px-6 py-2">
                      <div className="flex justify-between py-4">
                        <div>
                          <div className="leading-relaxed text-secondary-500">
                            {t("phone_number")}
                          </div>
                          <a
                            href={`tel:${user.phone_number}`}
                            className="font-semibold"
                          >
                            {user.phone_number || "-"}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {user.username && (
                  <UserDetails title="Facilities">
                    <ButtonV2
                      id="facilities"
                      className="flex w-full items-center @sm:w-1/2"
                      onClick={() => {
                        setExpandFacilityList(!expandFacilityList);
                        setSelectedUser(user);
                      }}
                    >
                      <CareIcon icon="l-hospital" className="text-lg" />
                      <p>{t("linked_facilities")}</p>
                    </ButtonV2>
                  </UserDetails>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }));

  if (!facilityUserData) {
    manageUsers = <Loading />;
  } else if (facilityUserData.results && facilityUserData.results.length) {
    manageUsers = (
      <div>
        <div className="flex flex-wrap md:-mx-4">{userList}</div>
        {facilityUserData && facilityUserData.count > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount: facilityUserData.count }}
              onChange={handlePagination}
            />
          </div>
        )}
      </div>
    );
  } else if (
    facilityUserData.results &&
    facilityUserData.results.length === 0
  ) {
    manageUsers = (
      <div>
        <div>
          <h5>{t("no_users_found")}</h5>
        </div>
      </div>
    );
  }

  return (
    <Page
      title={`${t("users")} - ${facilityData?.name}`}
      hideBack={true}
      breadcrumbs={false}
    >
      {linkFacility.show && (
        <LinkFacilityDialog
          username={linkFacility.username}
          handleOk={addFacility}
          handleCancel={hideLinkFacilityModal}
        />
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 md:gap-5">
        {facilityUserData && (
          <CountBlock
            text={t("total_users")}
            count={facilityUserData.count}
            loading={isLoading}
            icon="l-user-injured"
            className="flex-1"
          />
        )}
      </div>
      <SlideOver
        open={expandFacilityList}
        setOpen={setExpandFacilityList}
        slideFrom="right"
        title={t("facilities")}
        dialogClass="md:w-[400px]"
      >
        <UserFacilities user={selectedUser} />
      </SlideOver>
      <div>
        <div>{manageUsers}</div>
      </div>
      {userData.show && (
        <UserDeleteDialog
          name={userData.name}
          handleCancel={handleCancel}
          handleOk={handleSubmit}
        />
      )}
    </Page>
  );
}
