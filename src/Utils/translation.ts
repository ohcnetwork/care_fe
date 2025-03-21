import i18n from "@/i18n";

/**
 * Creates a data structure that updates automatically when translations change, to be used in non-react components
 *
 * @param updateFn Function that returns the translated data
 * @returns The translated data that will update reactively
 */
export function createTranslatableData<T>(updateFn: () => T): T {
  let data: T = updateFn();

  function update() {
    data = updateFn();
  }

  if (i18n.isInitialized) {
    update();
  }

  i18n.on("initialized", update);
  i18n.on("languageChanged", update);
  i18n.on("loaded", update);

  return data;
}
