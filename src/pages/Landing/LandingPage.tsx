import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { LoginHeader } from "@/components/Common/LoginHeader";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

const { customLogo, stateLogo, mainLogo } = careConfig;

export function LandingPage() {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-50 to-blue-100">
      {/* Header */}
      <div className="w-full p-4 shadow-md bg-white">
        <LoginHeader />
      </div>

      {/* Hero Section */}
      <main className="landing-hero flex-1 flex flex-col items-center pt-24 text-center z-100">
        {stateLogo && stateLogo.dark && (
          <div className="mb-2 animate-fade-in">
            <img
              src={stateLogo.dark}
              alt="Logo"
              className="h-28 w-auto drop-shadow-lg"
            />
          </div>
        )}

        <div className="mb-8 animate-fade-in">
          {(customLogo || mainLogo) && (
            <img
              src={customLogo?.dark ?? mainLogo?.dark}
              alt="Logo"
              className="h-20 w-auto drop-shadow-lg"
            />
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-green-900 mb-3 md:mb-4">
          Find the Best Care Facilities
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 max-w-sm md:max-w-lg">
          Search from a list of verified healthcare organizations to get the
          best care for your needs.
        </p>

        {/* Search Section */}
        <div className="w-full max-w-[584px] mx-auto space-y-6 px-6">
          <div className="relative" data-search-container>
            <div className="rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="flex items-center px-4 h-12">
                <CareIcon icon="l-search" className="h-5 w-5 text-green-800" />
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
                  placeholder="Search for an organization..."
                  className="flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-green-800 cursor-pointer shadow-none ring-0"
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
                  <CommandGroup className="overflow-y-auto max-h-80">
                    {filteredOrganizations.length === 0 ? (
                      <CommandEmpty>
                        Unable to find anything based on your search.
                      </CommandEmpty>
                    ) : (
                      filteredOrganizations.map((organization) => (
                        <CommandItem
                          key={organization.id}
                          value={organization.name.toLowerCase()}
                          onSelect={() =>
                            handleOrganizationSelect(organization.name)
                          }
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

          <div className="flex justify-center">
            <Button
              variant="primary"
              className="px-6 h-10 bg-green-700 hover:bg-green-900 text-white shadow-green-100 shadow-md hover:shadow-none"
              onClick={handleSearch}
              disabled={!selectedOrganization}
            >
              Search Facilities
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
