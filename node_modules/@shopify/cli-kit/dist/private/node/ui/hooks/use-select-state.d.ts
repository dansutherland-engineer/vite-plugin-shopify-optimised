import { Item } from '../components/SelectInput.js';
type Option<T> = Item<T>;
type OptionMapItem<T> = Option<T> & {
    previous: OptionMapItem<T> | undefined;
    next: OptionMapItem<T> | undefined;
    index: number;
};
export default class OptionMap<T> extends Map<T, OptionMapItem<T>> {
    readonly first: OptionMapItem<T> | undefined;
    constructor(options: Option<T>[]);
}
interface State<T> {
    /**
     * Map where key is option's value and value is option's index.
     */
    optionMap: OptionMap<T>;
    /**
     * Number of visible options.
     */
    visibleOptionCount: number;
    /**
     * Index of the first visible option.
     */
    visibleFromIndex: number;
    /**
     * Index of the last visible option.
     */
    visibleToIndex: number;
    /**
     * Value of the previously selected option.
     */
    previousValue: T | undefined;
    /**
     * Value of the selected option.
     */
    value: T | undefined;
}
export interface UseSelectStateProps<T> {
    /**
     * Number of items to display.
     *
     */
    visibleOptionCount: number;
    /**
     * Options.
     */
    options: Option<T>[];
    /**
     * Initially selected option's value.
     */
    defaultValue?: T;
}
export type SelectState<T> = Pick<State<T>, 'visibleOptionCount' | 'visibleFromIndex' | 'visibleToIndex' | 'value'> & {
    /**
     * Visible options.
     */
    visibleOptions: (Option<T> & {
        index: number;
    })[];
    /**
     * Select next option and scroll the list down, if needed.
     */
    selectNextOption: () => void;
    /**
     * Select previous option and scroll the list up, if needed.
     */
    selectPreviousOption: () => void;
    /**
     * Select option directly.
     */
    selectOption: (option: Option<T>) => void;
};
export declare const useSelectState: <T>({ visibleOptionCount, options, defaultValue }: UseSelectStateProps<T>) => {
    visibleFromIndex: number;
    visibleToIndex: number;
    value: unknown;
    visibleOptions: Option<T>[];
    selectNextOption: () => void;
    selectPreviousOption: () => void;
    selectOption: ({ option }: {
        option: Option<T>;
    }) => void;
    previousValue: unknown;
};
export {};
