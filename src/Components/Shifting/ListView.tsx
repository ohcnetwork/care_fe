import React, { useState } from "react";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import ListFilter from "./ListFilter";

const limit = 14;

const initialFilterData = {
  status: 'PENDING',
  facility: '',
  orgin_facility: '',
  shifting_approving_facility: '',
  assigned_facility: '',
  emergency: '',
  is_up_shift: '',
  limit: limit,
  offset: 0
}

export default function ListView(props: any) {

  const [filter, setFilter] = useState(initialFilterData);
  const [isLoading, setIsLoading] = useState(false);

  const filterOnChange = (filterData : any) => {
    setFilter(filterData);
    console.log(filterData);
  }

  const shiftingList = () => {
    if (isLoading) {
      return <Loading />
    } else {
      return (
        ""
      )
    }
  }

  return (
    <div className="mx-3 md:mx-8 mb-2">
        <PageTitle title={"Shifting"} hideBack={true} />

        <ListFilter
          filter={filter}
          onChange={filterOnChange}/>

        <div className="mt-4">
          {shiftingList()}
        </div>
    </div>
  )
}