interface CSVLinkProps {
  id: string;
  filename: string;
  data: string;
}

const CSVLink = (props: CSVLinkProps) => {
  const generateCsvDataURI = (csvData: any) => {
    const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(
      csvData
    )}`;
    return csvContent;
  };
  return (
    <a
      id={props.id}
      href={generateCsvDataURI(props.data)}
      download={props.filename}
      className="hidden"
    />
  );
};
export default CSVLink;
