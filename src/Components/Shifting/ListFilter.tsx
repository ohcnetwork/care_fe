import React from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { SelectField } from "../Common/HelperInputFields";
import { SHIFTING_CHOICES } from "../../Common/constants";

const shiftStatusOptions = ['Show All', ...SHIFTING_CHOICES.map(obj => obj.text)];

export default function ListFilter(props: any) {
  let { filter, onChange } = props;

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filter };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;
    
    onChange(filterData);
  };

  const handleChange = (event: any) => {
    let { name, value } = event.target;
    
    const filterData: any = { ...filter };
    filterData[name] = value;

    onChange(filterData);
};

  return (
    <div className="mt-2">
      <div className="font-light text-md">
        Filter By:
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Origin facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="orgin_facility"
              selected={filter.orgin_facility_ref}
              setSelected={(obj) => setFacility(obj, 'orgin_facility')}
              className="shifting-page-filter-dropdown"
              errors={''}/>
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Shifting approving facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="shifting_approving_facility"
              selected={filter.shifting_approving_facility_ref}
              setSelected={(obj) => setFacility(obj, 'shifting_approving_facility')}
              className="shifting-page-filter-dropdown"
              errors={''}/>
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Assigned facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="assigned_facility"
              selected={filter.assigned_facility_ref}
              setSelected={(obj) => setFacility(obj, 'assigned_facility')}
              className="shifting-page-filter-dropdown"
              errors={''}/>
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Status</span>
          <SelectField
                name="status"
                variant="outlined"
                margin="dense"
                optionArray={true}
                value={filter.status}
                options={shiftStatusOptions}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Is emergency case</span>
          <SelectField
                name="emergency"
                variant="outlined"
                margin="dense"
                optionArray={true}
                value={filter.emergency}
                options={['--','yes', 'no']}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Is upshift case</span>
          <SelectField
                name="is_up_shift"
                variant="outlined"
                margin="dense"
                optionArray={true}
                value={filter.is_up_shift}
                options={['--','yes', 'no']}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div>
      </div>
    </div>
  )
}