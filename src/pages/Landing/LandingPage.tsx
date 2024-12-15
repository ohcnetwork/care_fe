import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DistrictModel, LocalBodyModel } from "@/components/Facility/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";

const STATE_ID = "1"; // Kerala's state ID

export function LandingPage() {
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openLocalBody, setOpenLocalBody] = useState(false);
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictModel | null>(null);
  const [selectedLocalBody, setSelectedLocalBody] =
    useState<LocalBodyModel | null>(null);

  const { data: districtsResponse } = useQuery<RequestResult<DistrictModel[]>>({
    queryKey: ["districts", STATE_ID],
    queryFn: () =>
      request(routes.getDistrictByState, {
        pathParams: { id: STATE_ID },
      }),
  });

  const { data: localBodiesResponse } = useQuery<
    RequestResult<LocalBodyModel[]>
  >({
    queryKey: ["localBodies", selectedDistrict?.id],
    queryFn: () =>
      request(routes.getLocalbodyByDistrict, {
        pathParams: { id: selectedDistrict?.id?.toString() || "" },
      }),
    enabled: !!selectedDistrict?.id,
  });

  const districts = districtsResponse?.data || [];
  const localBodies = localBodiesResponse?.data || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedDistrict) {
      params.append("district", selectedDistrict.id.toString());
    }
    if (selectedLocalBody) {
      params.append("local_body", selectedLocalBody.id.toString());
    }
    navigate(`/facilities?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Find Healthcare Facilities
          </h1>

          <div className="flex flex-col items-center gap-4">
            <Popover open={openDistrict} onOpenChange={setOpenDistrict}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDistrict}
                  className="w-[400px] justify-between"
                >
                  {selectedDistrict
                    ? selectedDistrict.name
                    : "Select district..."}
                  <CareIcon
                    icon="l-angle-down"
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command className="w-[400px]">
                  <CommandInput placeholder="Search district..." />
                  <CommandEmpty>No district found.</CommandEmpty>
                  <CommandGroup className="overflow-y-auto max-h-80">
                    {districts.map((district) => (
                      <CommandItem
                        key={district.id}
                        onSelect={() => {
                          setSelectedDistrict(district);
                          setSelectedLocalBody(null);
                          setOpenDistrict(false);
                        }}
                      >
                        {district.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <Popover open={openLocalBody} onOpenChange={setOpenLocalBody}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLocalBody}
                  className="w-[400px] justify-between overflow-x-hidden"
                  disabled={!selectedDistrict}
                >
                  {selectedLocalBody
                    ? selectedLocalBody.name
                    : "Select local body..."}
                  <CareIcon
                    icon="l-angle-down"
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command className="w-[400px]">
                  <CommandInput placeholder="Search local body..." />
                  <CommandEmpty>No local body found.</CommandEmpty>
                  <CommandGroup className="overflow-y-auto max-h-80">
                    {localBodies.map((localBody) => (
                      <CommandItem
                        key={localBody.id}
                        onSelect={() => {
                          setSelectedLocalBody(localBody);
                          setOpenLocalBody(false);
                        }}
                      >
                        {localBody.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              variant="primary_gradient"
              className="w-[400px] h-12 text-lg"
              onClick={handleSearch}
              disabled={!selectedDistrict}
            >
              <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></span>
              Search Facilities
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
