import { useState } from "react";
import { useDispatch } from "react-redux";
import CSVLink from "../../Components/Common/CSVLink";

interface CSVLinkProps {
  id: string;
  filename: string;
  data: string;
}

interface FlattenedObject {
  id: string;
  status: string;
  asset_type: string;
  location_object_id: string;
  location_object_facility_id: string;
  location_object_facility_name: string;
  location_object_created_date: string;
  location_object_modified_date: string;
  location_object_name: string;
  location_object_description: string;
  location_object_location_type: number;
  created_date: string;
  modified_date: string;
  name: string;
  description: string;
  asset_class: string;
  is_working: boolean;
  not_working_reason: string;
  serial_number: string;
  warranty_details: string;
  meta_asset_type?: string;
  meta_local_ip_address?: string;
  vendor_name: string;
  support_name: string;
  support_phone: string;
  support_email: string;
  qr_code_id?: string;
  manufacturer: string;
  warranty_amc_end_of_validity?: string;
  last_serviced_on?: string;
  notes: string;
}

export default function useExport() {
  const dispatch: any = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [csvLinkProps, setCsvLinkProps] = useState<CSVLinkProps>({
    id: "csv-download-link",
    filename: "",
    data: "",
  });

  const _CSVLink = () => {
    const { filename, data, id } = csvLinkProps;
    return <CSVLink id={id} filename={filename} data={data} />;
  };

  const getTimestamp = () => new Date().toISOString();

  const flattenObject = (obj: any): FlattenedObject => {
    const result: FlattenedObject = {
      id: obj.id,
      status: obj.status,
      asset_type: obj.asset_type,
      location_object_id: obj.location_object?.id || "",
      location_object_facility_id: obj.location_object?.facility?.id || "",
      location_object_facility_name: obj.location_object?.facility?.name || "",
      location_object_created_date: obj.location_object?.created_date || "",
      location_object_modified_date: obj.location_object?.modified_date || "",
      location_object_name: obj.location_object?.name || "",
      location_object_description: obj.location_object?.description || "",
      location_object_location_type: obj.location_object?.location_type || 0,
      created_date: obj.created_date,
      modified_date: obj.modified_date,
      name: obj.name,
      description: obj.description,
      asset_class: obj.asset_class,
      is_working: obj.is_working,
      not_working_reason: obj.not_working_reason,
      serial_number: obj.serial_number,
      warranty_details: obj.warranty_details,
      meta_asset_type: obj.meta?.asset_type,
      meta_local_ip_address: obj.meta?.local_ip_address,
      vendor_name: obj.vendor_name,
      support_name: obj.support_name,
      support_phone: obj.support_phone,
      support_email: obj.support_email,
      qr_code_id: obj.qr_code_id,
      manufacturer: obj.manufacturer,
      warranty_amc_end_of_validity: obj.warranty_amc_end_of_validity,
      last_serviced_on: obj.last_serviced_on,
      notes: obj.notes,
    };

    return result;
  };
  const parseJSONtoCSV = (data: string) => {
    const json = JSON.parse(data);
    const flattened = json.map((obj: any) => flattenObject(obj));

    const csvHeader = Object.keys(flattened[0]).join(",");
    const csvRows = flattened.map((obj: any) => Object.values(obj).join(","));
    const csv = [csvHeader, ...csvRows].join("\n");
    return csv;
  };

  const exportCSV = async (filenamePrefix: string, action: any) => {
    setIsExporting(true);

    const filename = `${filenamePrefix}_${getTimestamp()}.csv`;

    const res = await dispatch(action);
    if (res.status === 200) {
      setCsvLinkProps({
        ...csvLinkProps,
        filename,
        data: parseJSONtoCSV(JSON.stringify(res.data.results)),
      });
      document.getElementById(csvLinkProps.id)?.click();
    }

    setIsExporting(false);
  };

  const exportJSON = async (
    filenamePrefix: string,
    action: any,
    parse = (data: string) => data
  ) => {
    setIsExporting(true);

    const res = await dispatch(action);
    if (res.status === 200) {
      const a = document.createElement("a");
      const blob = new Blob([parse(JSON.stringify(res.data.results))], {
        type: "application/json",
      });
      a.href = URL.createObjectURL(blob);
      a.download = `${filenamePrefix}-${getTimestamp()}.json`;
      a.click();
    }

    setIsExporting(false);
  };

  const exportFile = (
    action: any,
    filePrefix = "export",
    type = "csv",
    parse = (data: string) => data
  ) => {
    if (!action) return;

    switch (type) {
      case "csv":
        exportCSV(filePrefix, action());
        break;
      case "json":
        exportJSON(filePrefix, action(), parse);
        break;
      default:
        exportCSV(filePrefix, action());
    }
  };

  return {
    isExporting,

    _CSVLink,

    exportCSV,
    exportJSON,
    exportFile,
  };
}
