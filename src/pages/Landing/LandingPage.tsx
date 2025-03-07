import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

const { customLogo, stateLogo, mainLogo } = careConfig;

export function LandingPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const { data: organizationsResponse } = useQuery<
    PaginatedResponse<Organization>
  >({
    queryKey: ["organizations", "level", "1"],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: { level_cache: 1 },
    }),
  });

  const organizations = organizationsResponse?.results || [];

  const filteredOrganizations = organizations.filter((organization) =>
    organization.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <div className="text-center mb-4">
            <span className="text-sm md:text-base block sm:inline">
              {t("search_facilities")}
            </span>
            <span className="lg:ml-1 font-bold text-sm md:text-base block sm:inline">
              {t("search_facilities_note")}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full" data-search-container>
              <div className="rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center px-4 h-10 sm:h-11 md:h-12 bg-white rounded-lg">
                  <CareIcon icon="l-search" className="h-5 w-5 text-gray-400" />
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
                    placeholder="Enter district name to find facilities."
                    className="flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500 cursor-pointer shadow-none ring-0"
                  />
                  {(searchQuery || selectedOrganization) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        setSelectedOrganization(null);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <CareIcon
                        icon="l-times"
                        className="h-4 w-4 text-gray-400"
                      />
                    </button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-white shadow-lg z-10">
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
              variant="primary"
              className="w-full sm:w-auto px-4 md:px-6 h-10 sm:h-11"
              onClick={handleSearch}
              disabled={!selectedOrganization}
            >
              {t("search_button")}
            </Button>
          </div>
        </div>

        {/* Centered Dots Image */}
        <div className="flex justify-center my-6 md:my-8">
          <img src="/images/dots.svg" alt="" />
        </div>

        {/* Login Section */}
        <div className="w-full max-w-[620px] flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg">
          <div className="text-sm font-medium mb-4 md:mb-6 text-center">
            {t("login_already_registered")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-full justify-center">
            <div
              className="w-full min-h-[130px] md:min-h-[150px] flex flex-col items-center justify-center text-center p-3 md:p-4 rounded-xl hover:shadow-md transition-all relative overflow-hidden bg-white border-gray-100"
              style={{
                backgroundImage: 'url("/images/staff_background.png")',
                backgroundSize: "auto",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="w-full max-w-[40px] md:max-w-[48px] aspect-square mb-3 bg-green-100 rounded-full flex items-center justify-center border-2 border-white">
                <img
                  src="/images/health_worker.svg"
                  alt="Staff Login"
                  className="max-w-full max-h-full"
                />
              </div>

              {/* Staff Login Button */}
              <Button
                variant="outline"
                className="w-full text-xs md:text-sm border border-primary-600 text-primary-700 hover:text-primary-800 font-semibold"
                onClick={() => navigate(`/login?mode=staff`)}
              >
                {t("staff_login")}
              </Button>
              <p className="text-xs mt-2 w-full">
                {t("staff_login_description")}
              </p>
            </div>

            <div
              className="w-full min-h-[130px] md:min-h-[150px] flex flex-col items-center justify-center text-center p-3 md:p-4 rounded-xl border hover:shadow-md transition-all relative overflow-hidden bg-white"
              style={{
                backgroundImage: 'url("/images/paitent_background.png")',
                backgroundSize: "auto",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="w-full max-w-[40px] md:max-w-[48px] aspect-square mb-3 border-2 border-white bg-blue-100 rounded-full flex items-center justify-center">
                <img
                  src="/images/patient_icon.svg"
                  alt="Patient Login"
                  className="max-w-full max-h-full"
                />
              </div>
              {/* Patient Login Button */}
              <Button
                variant="outline"
                className="w-full text-xs md:text-sm border border-primary-600 text-primary-700 hover:text-primary-600 font-semibold transition-colors"
                onClick={() => navigate(`/login?mode=patient`)}
              >
                {t("patient_login")}
              </Button>
              <p className="text-xs mt-2 w-full">
                {t("patient_login_description")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
