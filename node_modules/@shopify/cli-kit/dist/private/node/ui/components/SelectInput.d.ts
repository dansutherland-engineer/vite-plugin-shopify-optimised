import React from 'react';
import { DOMElement } from 'ink';
declare module 'react' {
    function forwardRef<T, P>(render: (props: P, ref: React.Ref<T>) => JSX.Element | null): (props: P & React.RefAttributes<T>) => JSX.Element | null;
}
export interface SelectInputProps<T> {
    items: Item<T>[];
    initialItems?: Item<T>[];
    onChange?: (item: Item<T> | undefined) => void;
    enableShortcuts?: boolean;
    focus?: boolean;
    emptyMessage?: string;
    defaultValue?: T;
    highlightedTerm?: string;
    loading?: boolean;
    errorMessage?: string;
    hasMorePages?: boolean;
    morePagesMessage?: string;
    availableLines?: number;
    onSubmit?: (item: Item<T>) => void;
    inputFixedAreaRef?: React.RefObject<DOMElement>;
}
export interface Item<T> {
    label: string;
    value: T;
    key?: string;
    group?: string;
    helperText?: string;
    disabled?: boolean;
}
export declare const SelectInput: <T>(props: SelectInputProps<T> & React.RefAttributes<DOMElement>) => JSX.Element | null;
