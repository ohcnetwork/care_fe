declare const __CUSTOM_DESCRIPTION_HTML__: string | undefined;

declare module "__federation__" {
  export const __federation_method_getRemote: (
    name: string,
    path: string,
  ) => Promise<any>;
  export const __federation_method_setRemote: (
    name: string,
    config: {
      url: () => Promise<string>;
      format: string;
      from: string;
      externalType: string;
    },
  ) => void;
  export const __federation_method_unwrapDefault: <T>(module: T) => T;
}
