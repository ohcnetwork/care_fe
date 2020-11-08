export const externalResultFormatter = (props: any) => {
  let data = props.map((el: any) => {
    return {
      Id: el.id,
      Name: el.name,
      Address: el.address,
      Age: el.age,
      Gender: el.gender,
      Mobile: el.mobile_number,
      Ward: el.ward_object?.name || "NILL",
      Local_Body: el.local_body_object?.name || "NILL",
      District: el.district_object?.name,
      Result: el.result,
      Test_Type: el.test_type,
      Patient_Status: el.patient_status,
      Patient_Category: el.patient_category,
      SRF_ID: el.srf_id,
      Sample_Type: el.sample_type,
      Lab_Name: el.lab_name,
      Sample_Collection_Date: el.sample_collection_date,
      Result_Date: el.result_date,
    };
  });
  return data;
};
