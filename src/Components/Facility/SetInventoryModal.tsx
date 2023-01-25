import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getItems, postInventory } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { InventoryItemsModel, Unit } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import Loading from "../Common/Loading";

interface IProps {
  facilityId: string;
  show: boolean;
  onClose: () => void;
  item?: { id: string; item_object: InventoryItemsModel };
  action?: "add" | "use";
}

const SetInventoryModal = ({
  facilityId,
  show,
  onClose,
  item,
  action,
}: IProps) => {
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemsModel[]>(
    []
  );
  const [selectedItem, setSelectedItem] = useState<InventoryItemsModel>();
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState<Unit>();

  useEffect(() => {
    if (item) {
      setSelectedItem(item?.item_object);
      setInventoryItems([item?.item_object]);
      setQuantity(0);
      setUnit(item?.item_object?.default_unit);
    }
  }, [item]);

  useEffect(() => {
    setUnit(selectedItem?.default_unit);
  }, [selectedItem]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getItems({}));
      if (!status.aborted) {
        if (res && res.data) {
          setInventoryItems(res.data.results);
          setSelectedItem(res.data.results[0]);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (!item) fetchData(status);
    },
    [fetchData]
  );

  return (
    <DialogModal show={show} onClose={onClose} title="Manage Inventory">
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <SelectFormField
            name="inventory-item"
            value={selectedItem}
            options={inventoryItems}
            optionLabel={({ name }) => name}
            label="Inventory Item Name"
            onChange={(selected) => setSelectedItem(selected.value)}
            disabled={!!item}
          />
          <div className="flex items-center justify-evenly gap-2">
            <TextFormField
              id="inventory-item-quantity"
              name="inventory-item-quantity"
              label="Quantity"
              value={quantity as any}
              onChange={(e) => setQuantity(e.value as any)}
              type="number"
              min={0}
            />
            <SelectFormField
              name="inventory-item"
              value={unit}
              options={selectedItem?.allowed_units || []}
              optionLabel={({ name }) => name}
              label="Unit"
              onChange={(selected) => setUnit(selected.value)}
              disabled={!selectedItem}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Cancel onClick={onClose} />
            <Submit
              onClick={async () => {
                const data = {
                  item: selectedItem?.id,
                  unit: unit?.id,
                  is_incoming: action === "add" ? true : false,
                  quantity,
                };

                const res = await dispatchAction(
                  postInventory(data, { facilityId })
                );
                if (
                  res &&
                  res.data &&
                  (res.status === 200 || res.status === 201)
                ) {
                  Notification.Success({
                    msg:
                      action === "add"
                        ? "Stocks Added Successfully"
                        : "Stocks Utilization Noted",
                  });
                }
                onClose?.();
              }}
            />
          </div>
        </>
      )}
    </DialogModal>
  );
};

export default SetInventoryModal;
