import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { listAssets } from "../../Redux/actions";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";

interface AssetSelectProps {
  name: string;
  errors?: string | undefined;
  className?: string;
  facility?: string;
  is_working?: boolean;
  in_use_by_consultation?: boolean;
  is_permanent?: boolean;
  multiple?: boolean;
  AssetType?: number;
  showAll?: boolean;
  showNOptions?: number;
  freeText?: boolean;
  selected: any;
  setSelected: (selected: any) => void;
}

export const AssetSelect = (props: AssetSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    facility,
    is_working = true,
    in_use_by_consultation = false,
    is_permanent = null,
    showNOptions = 10,
    className = "",
    freeText = false,
    errors = "",
  } = props;

  const dispatchAction: any = useDispatch();

  const AssetSearch = useCallback(
    async (text: string) => {
      const params = {
        limit: 50,
        offset: 0,
        search_text: text,
        facility,
        is_working,
        in_use_by_consultation,
        is_permanent,
      };

      const res = await dispatchAction(listAssets(params));
      if (freeText)
        res?.data?.results?.push({
          id: -1,
          name: text,
        });
      return res?.data?.results;
    },
    [dispatchAction]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      fetchData={AssetSearch}
      showNOptions={showNOptions}
      optionLabel={(option: any) => option.name}
      compareBy="id"
      className={className}
      error={errors}
    />
  );
};
