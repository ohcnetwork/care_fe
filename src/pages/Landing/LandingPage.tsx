import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";

import { usePatientSignOut } from "@/hooks/usePatientSignOut";

import { LocalStorageKeys } from "@/common/constants";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { TokenData } from "@/types/otp/otp";

const { customLogo, stateLogo, mainLogo } = careConfig;

export function LandingPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const signOut = usePatientSignOut();
  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(LocalStorageKeys.patientTokenKey) || "{}",
  );

  const isLoggedIn =
    tokenData.token &&
    Object.keys(tokenData).length > 0 &&
    dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"));
  const { data: organizationsResponse } = useQuery({
    queryKey: ["organizations", "level", "1"],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: { level_cache: 1 },
    }),
  });

  const organizations = organizationsResponse?.results || [];

  const filteredOrganizations = organizations.filter((organization) =>
    organization.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const orgType = organizations[0]?.metadata?.govt_org_type
    ? t(
        `SYSTEM__govt_org_type__${organizations[0]?.metadata?.govt_org_type}`,
      ).toLowerCase()
    : "unknown";

  const inputRef = useRef<HTMLInputElement>(null);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedOrganization(null);
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (selectedOrganization) {
      setSearchQuery(selectedOrganization.name);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = document.querySelector("[data-search-container]");

      if (!searchContainer?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedOrganization) {
      params.append("organization", selectedOrganization.id.toString());
    }
    navigate(`/facilities?${params.toString()}`);
  };

  const handleOrganizationSelect = (value: string) => {
    const organization = organizations.find(
      (o) => o.name.toLowerCase() === value.toLowerCase(),
    );
    if (organization) {
      setSelectedOrganization(organization);
      setSearchQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-5">
      {/* Main Content  */}
      {isLoggedIn && (
        <header className="w-full">
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="ghost"
              className="text-sm font-medium hover:bg-gray-100 px-6"
              onClick={() => navigate("/patient/home")}
            >
              {t("home")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar name={"User"} className="size-7 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-gray-500">
                  <span className="font-medium">{tokenData.phoneNumber}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={signOut}
                >
                  <CareIcon icon="l-signout" className="mr-2 size-4" />
                  {t("sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}
      <main className="lg:flex-1 flex flex-col items-center justify-center py-4 md:py-8">
        {/* Logo Section */}
        <div className="w-full flex flex-col items-center mt-2 md:mt-0">
          {stateLogo && stateLogo.dark && (
            <div className="mb-2">
              <img
                src={stateLogo.dark}
                alt="Logo"
                className="h-20 md:h-28 w-auto"
              />
            </div>
          )}

          {(customLogo || mainLogo) && (
            <div className="mb-4 md:mb-8">
              <img
                src={customLogo?.dark ?? mainLogo?.dark}
                alt="Logo"
                className="h-16 md:h-20 w-auto"
              />
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="w-full max-w-[620px] mx-auto px-4 sm:px-6 py-4 bg-gray-100 rounded-md">
          <div className="text-center mb-4 space-x-1">
            <span className="text-sm md:text-base block sm:inline">
              <Trans
                i18nKey="search_facilities"
                components={{
                  strong: <strong />,
                }}
              />
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-9/12" data-search-container>
              <div className="rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center px-2 bg-white rounded-lg">
                  <CareIcon icon="l-search" className="size-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={
                      selectedOrganization
                        ? selectedOrganization.name
                        : searchQuery
                    }
                    onChange={handleSearchChange}
                    onClick={handleInputClick}
                    placeholder={t(`landing_search_placeholder`, {
                      orgType,
                    })}
                    className="w-full border-0 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-gray-500 cursor-pointer shadow-none ring-0"
                  />
                  {(searchQuery || selectedOrganization) && (
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        setSelectedOrganization(null);
                      }}
                      className="p-1 hover:bg-transparent"
                    >
                      <CareIcon
                        icon="l-times"
                        className="size-4 text-gray-400"
                      />
                    </Button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                  <Command>
                    <CommandGroup className="overflow-y-auto max-h-60 md:max-h-80">
                      {filteredOrganizations.length === 0 ? (
                        <CommandEmpty>{t("search_no_results")}</CommandEmpty>
                      ) : (
                        filteredOrganizations.map((organization) => (
                          <CommandItem
                            key={organization.id}
                            value={organization.name.toLowerCase()}
                            onSelect={() => {
                              handleOrganizationSelect(organization.name);
                            }}
                            className="cursor-pointer"
                          >
                            {organization.name}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </div>
              )}
            </div>
            {/* Search Button */}
            <Button
              variant="primary_gradient"
              className="w-full sm:w-3/12"
              onClick={handleSearch}
              disabled={!selectedOrganization}
            >
              <span className="bg-linear-to-b from-white/15 to-transparent"></span>
              {t("search_button")}
            </Button>
          </div>
        </div>

        {/* Centered Dots Image */}
        <div className="flex justify-center my-6 md:my-8">
          <img src="/images/dots.svg" alt="" />
        </div>

        {/* Login Section */}
        {!isLoggedIn && (
          <div className="w-full max-w-[620px] flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg">
            <div className="text-sm font-medium mb-4 md:mb-6 text-center">
              {t("login_already_registered")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-full justify-center">
              <div className="flex flex-col items-center justify-center gap-5 p-3 rounded-xl shadow-sm bg-white hover:shadow-md transition-all bg-[url('/images/staff_background.png')] bg-auto bg-center bg-no-repeat">
                <div className="rounded-full bg-green-100 m-2 p-1 aspect-square flex justify-center items-center border-2 border-white shadow-sm">
                  <CareIcon
                    icon="d-health-worker"
                    className="size-8 text-green-700"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    className="w-full text-xs md:text-sm border border-primary-600 text-primary-700 hover:text-primary-800 font-semibold"
                    onClick={() => navigate(`/login?mode=staff`)}
                  >
                    {t("staff_login")}
                  </Button>
                  <p className="text-xs mt-2 w-full text-center">
                    {t("staff_login_description")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-5 p-3 rounded-xl shadow-sm bg-white hover:shadow-md transition-all bg-[url('/images/patient_background.png')] bg-auto bg-center bg-no-repeat">
                <div className="rounded-full bg-indigo-100 m-2 p-1 aspect-square flex justify-center items-center border-2 border-white shadow-sm">
                  <CareIcon
                    icon="d-patient"
                    className="size-8 text-indigo-700"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    className="w-full text-xs md:text-sm border border-primary-600 text-primary-700 hover:text-primary-800 font-semibold"
                    onClick={() => navigate(`/login?mode=patient`)}
                  >
                    {t("patient_login")}
                  </Button>
                  <p className="text-xs mt-2 w-full text-center">
                    {t("patient_login_description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
