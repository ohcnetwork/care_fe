import { LocationList as LocationListType } from "@/types/location/location";

export function getParentChain(location: LocationListType): LocationListType[] {
  const parentChain: LocationListType[] = [];
  let current = location.parent;

  while (current) {
    parentChain.push(current);
    current = current.parent;
  }

  return parentChain;
}
