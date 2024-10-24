export type ScribeStatus =
    | "FAILED"
    | "IDLE"
    | "RECORDING"
    | "UPLOADING"
    | "TRANSCRIBING"
    | "THINKING"
    | "REVIEWING";

export interface ScribeForm {
    status: ScribeStatus;
    inputs: ScribeInput<any>[];
    hydratedInputs?: ScribeField<any>[]
    lastTranscript?: string;
    lastAIResponse?: { [key: string]: unknown }
    reviewedAIResponses: { [key: string]: boolean }
    instanceId?: string;
}

export interface ScribeProviderProps {
    children: React.ReactNode;
}

export interface FieldOption {
    id: string | number;
    text: string;
}

export interface ScribeField<T> {
    friendlyName: string;
    id: string;
    description: string;
    type: string;
    example: string;
    current: T;
    options?: readonly FieldOption[]
}

export type ScribeInput<T> = Omit<ScribeField<T>, "current"> & {
    options?: readonly FieldOption[];
    value: () => Promise<T> | T,
} & (T extends any[]
    ? {
        comparer: (a: T[number], b: T[number]) => boolean,
        updatableFields: (keyof T[number])[]
        onDelete: (fullItem: T[number]) => Promise<unknown> | unknown;
        onAdd: (fullItem: T[number]) => Promise<unknown> | unknown;
        onUpdate: (strippedItem: Partial<T[number]>, fullItem: T[number]) => Promise<unknown> | unknown;
    } : { onUpdate: (strippedItem: Partial<T>, fullItem: T) => Promise<unknown> | unknown; })

export type ScribeInputProps<T> = {
    children: (props: { value: () => T, aiResponse?: T } & (T extends any[] ? { actions?: ScribeActions<T> } : {})) => React.ReactNode;
} & ScribeInput<T>

export interface ScribeControlProps { }

export type ScribeActions<T extends any[]> = {
    updates: T[number][];
    deletes: T[number][];
    creates: T[number][];
}