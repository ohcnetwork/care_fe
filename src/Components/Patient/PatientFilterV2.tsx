import React, { useEffect, useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { SelectField, DateInputField, TextInputField } from "../Common/HelperInputFields";
import { PATIENT_FILTER_ORDER, GENDER_TYPES, DISEASE_STATUS, PATIENT_FILTER_CATEGORY, PATIENT_FILTER_ADMITTED_TO, PATIENT_FILTER_DECLARED_STATUS } from "../../Common/constants";
import moment from "moment";
import { getFacility } from '../../Redux/actions';
import { useDispatch } from 'react-redux';
import { CircularProgress } from '@material-ui/core';
import { navigate } from 'raviger';

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) => setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
}

export default function PatientFilterV2(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [isFacilityLoading, setFacilityLoading] = useState(false);
  const [filterState, setFilterState] = useMergeState({
    facility: filter.facility || '',
    facility_ref: null,
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    ordering: filter.ordering,
    category: filter.category || null,
    gender: filter.gender || null,
    disease_status: filter.disease_status || null,
    age_min: filter.age_min || null,
    age_max: filter.age_max || null,
    is_declared_positive: filter.is_declared_positive || null,
    date_declared_positive_before: filter.date_declared_positive_before || null,
   date_declared_positive_after: filter.date_declared_positive_after || null,
    last_consultation_admission_date_before: filter.last_consultation_admission_date_before || null,
    last_consultation_admission_date_after: filter.last_consultation_admission_date_after || null,
    last_consultation_discharge_date_before: filter.last_consultation_discharge_date_before || null,
    last_consultation_discharge_date_after: filter.last_consultation_discharge_date_after || null,
    last_consultation_admitted_to: filter.last_consultation_admitted_to || null,
    srf_id: filter.srf_id || null,
  });
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (filter.facility) {
        setFacilityLoading(true);
        const res = await dispatch(getFacility(filter.facility, 'facility'))
        if (res && res.data) {
          setFilterState({ facility_ref: res.data });
        }
        setFacilityLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const handleChange = (event: any) => {
    let { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const applyFilter = () => {
    const {
      facility,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ordering,
      category,
      gender,
      disease_status,
      is_declared_positive,
      date_declared_positive_before,
      date_declared_positive_after,
      age_min,
      age_max,
      last_consultation_admission_date_before,
      last_consultation_admission_date_after,
      last_consultation_discharge_date_before,
      last_consultation_discharge_date_after,
      last_consultation_admitted_to,
      srf_id,

    } = filterState;
    const data = {
      facility: facility || '',
      created_date_before: created_date_before && moment(created_date_before).isValid() ? moment(created_date_before).format('YYYY-MM-DD') : '',
      created_date_after: created_date_after && moment(created_date_after).isValid() ? moment(created_date_after).format('YYYY-MM-DD') : '',
      modified_date_before: modified_date_before && moment(modified_date_before).isValid() ? moment(modified_date_before).format('YYYY-MM-DD') : '',
      modified_date_after: modified_date_after && moment(modified_date_after).isValid() ? moment(modified_date_after).format('YYYY-MM-DD') : '',
      last_consultation_admission_date_before: last_consultation_admission_date_before && moment(last_consultation_admission_date_before).isValid() ? moment(last_consultation_admission_date_before).format('YYYY-MM-DD') : '',
      last_consultation_admission_date_after: last_consultation_admission_date_after && moment(last_consultation_admission_date_after).isValid() ? moment(last_consultation_admission_date_after).format('YYYY-MM-DD') : '',
      last_consultation_discharge_date_before: last_consultation_discharge_date_before && moment(last_consultation_discharge_date_before).isValid() ? moment(last_consultation_discharge_date_before).format('YYYY-MM-DD') : '',
      last_consultation_discharge_date_after: last_consultation_discharge_date_after && moment(last_consultation_discharge_date_after).isValid() ? moment(last_consultation_discharge_date_after).format('YYYY-MM-DD') : '',
      ordering: ordering || '',
      category: category || '',
      gender: gender || '',
      disease_status: (disease_status == 'Show All' ? '' : disease_status) || '',
      is_declared_positive : is_declared_positive || '',
      date_declared_positive_before: date_declared_positive_before && moment(date_declared_positive_before).isValid() ? moment(date_declared_positive_before).format('YYYY-MM-DD') : '',
      date_declared_positive_after: date_declared_positive_after && moment(date_declared_positive_after).isValid() ? moment(date_declared_positive_after).format('YYYY-MM-DD') : '',
      age_min: age_min || '',
      age_max: age_max || '',
      last_consultation_admitted_to: last_consultation_admitted_to || '',
      srf_id: srf_id || '',
    }
    onChange(data);
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />Cancel
        </button>
        <button className="btn btn-default" onClick={_ => { navigate("/patients") }}>
          <i className="fas fa-times mr-2" />Clear Filter
        </button>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />Apply
        </button>
      </div>
      <div className="w-64 flex-none mt-2">
        <span className="text-sm font-semibold">Ordering</span>
        <SelectField
          name="ordering"
          variant="outlined"
          margin="dense"
          optionKey="text"
          optionValue="desc"
          value={filterState.ordering}
          options={[{ desc: "Select", text: '' }, ...PATIENT_FILTER_ORDER]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
      <div className="font-light text-md mt-2">
        Filter By:
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Facility</span>
          <div className="">
            {isFacilityLoading ? (
              <CircularProgress size={20} />
            ) : (
                <FacilitySelect
                  multiple={false}
                  name="facility"
                  selected={filterState.facility_ref}
                  setSelected={(obj) => setFacility(obj, 'facility')}
                  className="shifting-page-filter-dropdown"
                  errors={''} />
              )}
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Gender</span>
          <SelectField
            name="gender"
            variant="outlined"
            margin="dense"
            value={filterState.gender}
            options={[{ id: '', text: 'Show All' }, ...GENDER_TYPES]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Category</span>
          <SelectField
            name="category"
            variant="outlined"
            margin="dense"
            value={filterState.category}
            options={[{ id: '', text: 'Show All' }, ...PATIENT_FILTER_CATEGORY]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Disease Status</span>
          <SelectField
            name="disease_status"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={filterState.disease_status}
            options={['Show All', ...DISEASE_STATUS]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Patient Declared Status</span>
          <SelectField
            name="is_declared_positive"
            variant="outlined"
            margin="dense"
            value={filterState.is_declared_positive}
            options={[{ id: '', text: 'Show All' }, ...PATIENT_FILTER_DECLARED_STATUS]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Declared Positive Before</span>
          <DateInputField
            id="date_declared_positive_before"
            name="date_declared_positive_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.date_declared_positive_before}
            onChange={date => handleChange({ target: { name: "date_declared_positive_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Declared Positive After</span>
          <DateInputField
            id="date_declared_positive_after"
            name="date_declared_positive_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.date_declared_positive_after}
            onChange={date => handleChange({ target: { name: "date_declared_positive_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Last Admitted to</span>
          <SelectField
            name="last_consultation_admitted_to"
            variant="outlined"
            margin="dense"
            value={filterState.last_consultation_admitted_to}
            options={[{ id: '', text: 'Show All' }, ...PATIENT_FILTER_ADMITTED_TO]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Created Date Before</span>
          <DateInputField
            id="created_date_before"
            name="created_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.created_date_before}
            onChange={date => handleChange({ target: { name: "created_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Created Date After</span>
          <DateInputField
            id="created_date_after"
            name="created_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.created_date_after}
            onChange={date => handleChange({ target: { name: "created_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Modified Date Before</span>
          <DateInputField
            id="modified_date_before"
            name="modified_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.modified_date_before}
            onChange={date => handleChange({ target: { name: "modified_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Modified Date After</span>
          <DateInputField
            id="modified_date_after"
            name="modified_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.modified_date_after}
            onChange={date => handleChange({ target: { name: "modified_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Admitted Before</span>
          <DateInputField
            id="last_consultation_admission_date_before"
            name="last_consultation_admission_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_admission_date_before}
            onChange={date => handleChange({ target: { name: "last_consultation_admission_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Admitted After</span>
          <DateInputField
            id="last_consultation_admission_date_after"
            name="last_consultation_admission_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_admission_date_after}
            onChange={date => handleChange({ target: { name: "last_consultation_admission_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Discharge Before</span>
          <DateInputField
            id="last_consultation_discharge_date_before"
            name="last_consultation_discharge_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_discharge_date_before}
            onChange={date => handleChange({ target: { name: "last_consultation_discharge_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Discharge After</span>
          <DateInputField
            id="last_consultation_discharge_date_after"
            name="last_consultation_discharge_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_discharge_date_after}
            onChange={date => handleChange({ target: { name: "last_consultation_discharge_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Age</span>
          <div className="flex justify-between">
            <TextInputField
              id="age_min"
              name="age_min"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.age_min}
              onChange={handleChange}
              label="Min Age"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1" />
            <TextInputField
              id="age_max"
              name="age_max"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.age_max}
              onChange={handleChange}
              label="Max Age"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">SRF ID</span>
          <div className="flex justify-between">
            <TextInputField
              id="srf_id"
              name="srf_id"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.srf_id}
              onChange={handleChange}
              label="Srf id"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1" />
          </div>
        </div>

      </div>
    </div>
  )
}
