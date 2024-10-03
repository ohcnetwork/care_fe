const modules = import.meta.glob("./*.json");

let translations = {};
for (const path in modules) {
  const module = (await modules[path]()) as { [key: string]: string };
  translations = { ...translations, ...module };
}

export default translations;
