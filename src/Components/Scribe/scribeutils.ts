import _ from "lodash";

export interface ScribeReducerOptions<T> {
  existingData: T[];
  newData: T[];
  comparer: (a: T, b: T) => boolean;
  onUpdate?: (strippedItem: Partial<T>, item: T) => Promise<unknown> | unknown;
  onDelete?: (item: T) => Promise<unknown> | unknown;
  onAdd?: (strippedItem: Partial<T>, item: T) => Promise<unknown> | unknown;
  allowedFields: (keyof T)[];
}

export type ScribeFieldOption = {
  value: string,
  text: string
}

export type ScribeField = {
  type: "string" | "number" | "date" | "datetime-local" | "select" | "cui-select" | "radio" | "checkbox"
  fieldElement: Element,
  label: string;
  options?: ScribeFieldOption[];
  value: string | null;
}

export async function scribeReducer<T>(
  options: ScribeReducerOptions<T>,
): Promise<void> {
  const {
    existingData,
    newData,
    onUpdate,
    onDelete,
    onAdd,
    allowedFields,
    comparer,
  } = options;

  const coveredItems: T[] = [];
  for (const item of newData) {
    const existingItem = existingData.find((d) => comparer(d, item));
    // Check if item is altered or added
    if (!_.isEqual(item, existingItem)) {
      if (existingItem) {
        // item was altered
        await onUpdate?.(_.pick(item, allowedFields), item);
      } else {
        // symptom does not exist, so must be added
        await onAdd?.(_.pick(item, allowedFields), item);
      }
    }
    coveredItems.push(item);
  }
  // check for deleted items
  const deletedItems =
    existingData?.filter((s) => !coveredItems.find((c) => comparer(c, s))) ||
    [];
  for (const item of deletedItems) {
    //item was deleted
    await onDelete?.(item);
  }
}

const isVisible = (elem: HTMLElement) => !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length || window.getComputedStyle(elem).visibility !== "hidden");

export const scrapeFields = () => {
  const formElement = document.querySelector(`[data-scribe-form="true"]`) as HTMLElement;
  if (!formElement || !isVisible(formElement)) throw Error("Cannot find a scribeable form. Make sure to mark forms with the \"data-scribe-form\" attribute");
  const inputElements = [...(formElement.querySelectorAll('input:not([type="submit"]):not([role="combobox"])') as NodeListOf<HTMLInputElement>).values().filter(ele => isVisible(ele))];
  const textAreaElements = [...(formElement.querySelectorAll('textarea') as NodeListOf<HTMLTextAreaElement>).values().filter(ele => isVisible(ele))]
  const selectElements = [...(formElement.querySelectorAll(`select`) as NodeListOf<HTMLSelectElement>).values().filter(ele => isVisible(ele))];
  // Care UI (Headless UI) does not use the traditional <select> field for dropdowns.
  const careUISelectElements = [...(formElement.querySelectorAll(`[data-cui-listbox]`) as NodeListOf<HTMLButtonElement>).values().filter(ele => isVisible(ele))];

  const getInputType: (t: string | null) => ScribeField["type"] = (type: string | null) =>
    type && ["string", "number", "date", "datetime-local", "radio", "checkbox"].includes(type) ? type as ScribeField["type"] : "string"


  const inputs: ScribeField[] = inputElements.filter(ele => !["radio", "checkbox"].includes(ele.getAttribute("type") || "")).map((ele) => ({
    type: getInputType(ele.getAttribute("type")),
    fieldElement: ele,
    label: ele.labels?.[0]?.innerText || "",
    value: ele.value
  }))

  const checkBoxesAndRadios: ScribeField[] = Array.from(
    new Map(
      inputElements
        .filter(ele => ["radio", "checkbox"].includes(ele.getAttribute("type") || ""))
        .map((ele) => [
          ele.getAttribute("name"), // use the `name` attribute as the key
          {
            type: getInputType(ele.getAttribute("type")),
            fieldElement: ele,
            label: (document.querySelector(`label[for=${ele.getAttribute("name")}]`) as HTMLLabelElement)?.innerText || "",
            options: [...(document.querySelectorAll(`input[name=${ele.getAttribute("name")}]`) as NodeListOf<HTMLInputElement>)].map((inp) => ({ text: (document.querySelector(`label[for="${inp.id}"]`) as HTMLLabelElement).innerText, value: inp.value })),
            value: [...(document.querySelectorAll(`input[name=${ele.getAttribute("name")}]`) as NodeListOf<HTMLInputElement>)].find(radio => radio.checked)?.value || null
          },
        ])
    ).values()
  );

  const textareas: ScribeField[] = textAreaElements.map((ele) => ({
    type: "string",
    fieldElement: ele,
    label: ele.labels?.[0]?.innerText || "",
    value: ele.value
  }))

  const selects: ScribeField[] = selectElements.map((ele) => ({
    type: "select",
    fieldElement: ele,
    label: ele.labels?.[0]?.innerText || "",
    options: [...ele.querySelectorAll("option")].map((option) => ({
      value: option?.value || "",
      text: option?.innerText
    })),
    value: ele.value
  }))

  const cuiSelects: ScribeField[] = careUISelectElements.map((ele) => ({
    type: "cui-select",
    fieldElement: ele,
    label: (ele.parentElement?.parentElement?.querySelector("label:not([data-headlessui-state])") as HTMLLabelElement)?.innerText,
    options: (JSON.parse(ele.getAttribute("data-cui-listbox-options") || "[]") as [string, string][]).map(([value, text]) => ({ text, value })),
    value: JSON.parse(ele.getAttribute("data-cui-listbox-value") || `""`)
  }))

  const fields = [
    ...inputs,
    ...textareas,
    ...selects,
    ...cuiSelects,
    ...checkBoxesAndRadios
  ]

  return fields;
}