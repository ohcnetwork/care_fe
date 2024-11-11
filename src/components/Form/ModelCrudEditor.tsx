import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";

import { classNames } from "@/Utils/utils";

interface Identifier {
  id: string;
}

export interface ModelCrudEditorProps<TRes extends Identifier, TReq, TErr> {
  onCreate?: (req: TReq) => Promise<unknown>;
  onUpdate?: (itemId: string, req: TReq) => Promise<unknown>;
  onDelete?: (itemId: string) => Promise<unknown>;
  items?: TRes[];
  children: (
    item: TRes | TReq,
    setItem: (item: TRes | TReq) => void,
    processing: boolean,
    errors?: TErr,
  ) => React.ReactNode;
  loading: boolean;
  errors: TErr;
  emptyText?: React.ReactNode;
  empty: TReq;
  createText?: React.ReactNode;
  allowCreate?: (item: TReq) => boolean;
}

export default function ModelCrudEditor<TRes extends Identifier, TReq, TErr>(
  props: ModelCrudEditorProps<TRes, TReq, TErr>,
) {
  const { t } = useTranslation();

  const {
    onCreate,
    onUpdate,
    onDelete,
    items,
    children,
    loading,
    errors,
    emptyText,
    empty,
    createText,
    allowCreate,
  } = props;
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdate = async (itemId: string, item: TReq) => {
    if (!onUpdate) return;
    setUpdating(itemId);
    await onUpdate(itemId, item);
    setUpdating(null);
  };

  const handleDelete = async (itemId: string) => {
    if (!onDelete) return;
    setUpdating(itemId);
    await onDelete(itemId);
    setUpdating(null);
  };

  const handleCreate = async (item: TReq) => {
    if (!onCreate) return;
    setCreating(true);
    await onCreate(item);
    setCreating(false);
  };

  type FormProps =
    | {
        type: "creating";
        item: TReq;
      }
    | {
        type: "updating";
        item: TRes;
      };

  const Form = (props: FormProps) => {
    const [item, setItem] = useState(props.item);
    const processing =
      props.type === "creating" ? creating : props.item.id === updating;

    useEffect(() => {
      if (
        props.type === "updating" &&
        JSON.stringify(item) !== JSON.stringify(props.item)
      ) {
        const timeout = setTimeout(() => {
          handleUpdate(props.item.id, item as TReq);
        }, 1000);
        return () => clearTimeout(timeout);
      }
    }, [item]);

    return (
      <div className="flex w-full flex-col items-center gap-4 md:flex-row">
        {children(item, setItem, processing, errors)}
        {props.type === "creating" && (
          <ButtonV2
            id="add-symptom"
            type="button"
            className="w-full py-3 md:w-auto"
            loading={creating}
            disabled={allowCreate?.(item as TReq)}
            onClick={() => handleCreate(item as TReq)}
          >
            {createText || "Create"}
          </ButtonV2>
        )}
        {props.type === "updating" && onDelete && (
          <button
            disabled={processing}
            onClick={() => handleDelete(props.item.id)}
            className="w-full text-xl text-red-500 hover:text-red-700 disabled:grayscale md:w-auto"
          >
            <CareIcon icon="l-times-circle" />{" "}
            <span className="text-sm md:hidden">{t("remove")}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-start rounded-lg border border-secondary-400">
      <ul
        className={classNames(
          "flex w-full flex-col gap-4 p-4",
          loading && "pointer-events-none animate-pulse",
        )}
      >
        {items?.map((item, i) => (
          <li key={i} className="flex w-full items-center gap-4">
            <Form type="updating" item={item} />
          </li>
        ))}

        {items?.length === 0 && (
          <div className="flex h-full w-full items-center justify-center py-10 text-center font-medium text-secondary-700">
            {emptyText}
          </div>
        )}
      </ul>
      <div className="flex w-full items-center gap-4 rounded-b-lg border-t-2 border-dashed border-secondary-400 bg-secondary-100 p-4">
        <Form type="creating" item={empty} />
      </div>
    </div>
  );
}
