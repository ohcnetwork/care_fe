export const defaultMatch = (searchText: string, item: any) => {
  return item.name.toLowerCase().includes(searchText.toLowerCase());
};

export const defaultCompare = (a: any, b: any) => {
  return a.id === b.id;
};
