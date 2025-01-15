import { useReducer, useCallback, useMemo, useState } from 'react';
import { isDeepStrictEqual } from 'node:util';
export default class OptionMap extends Map {
    constructor(options) {
        const items = [];
        let firstItem;
        let previous;
        let index = 0;
        for (const option of options) {
            const item = {
                ...option,
                previous,
                next: undefined,
                index,
            };
            if (previous) {
                previous.next = item;
            }
            if (!firstItem) {
                firstItem = item;
            }
            items.push([option.value, item]);
            index++;
            previous = item;
        }
        super(items);
        this.first = firstItem;
    }
}
const reducer = (state, action) => {
    switch (action.type) {
        case 'select-next-option': {
            if (typeof state.value === 'undefined') {
                return state;
            }
            const item = state.optionMap.get(state.value);
            if (!item) {
                return state;
            }
            let next = item.next;
            while (next && next.disabled) {
                next = next.next;
            }
            if (!next) {
                return state;
            }
            const needsToScroll = next.index > state.visibleToIndex;
            if (!needsToScroll) {
                return {
                    ...state,
                    value: next.value,
                };
            }
            const nextVisibleToIndex = next.index;
            const nextVisibleFromIndex = nextVisibleToIndex - state.visibleOptionCount + 1;
            return {
                ...state,
                value: next.value,
                visibleFromIndex: nextVisibleFromIndex,
                visibleToIndex: nextVisibleToIndex,
                previousValue: state.value,
            };
        }
        case 'select-previous-option': {
            if (typeof state.value === 'undefined') {
                return state;
            }
            const item = state.optionMap.get(state.value);
            if (!item) {
                return state;
            }
            let previous = item.previous;
            while (previous && previous.disabled) {
                previous = previous.previous;
            }
            if (!previous) {
                return state;
            }
            const needsToScroll = previous.index < state.visibleFromIndex;
            if (!needsToScroll) {
                return {
                    ...state,
                    value: previous.value,
                };
            }
            const nextVisibleFromIndex = previous.index;
            const nextVisibleToIndex = nextVisibleFromIndex + state.visibleOptionCount - 1;
            return {
                ...state,
                value: previous.value,
                visibleFromIndex: nextVisibleFromIndex,
                visibleToIndex: nextVisibleToIndex,
                previousValue: state.value,
            };
        }
        case 'select-option': {
            const item = state.optionMap.get(action.option.value);
            if (!item) {
                return state;
            }
            return {
                ...state,
                value: item.value,
                previousValue: state.value,
            };
        }
        case 'reset': {
            return action.state;
        }
        default: {
            return state;
        }
    }
};
const createDefaultState = ({ visibleOptionCount: customVisibleOptionCount, defaultValue, options, }) => {
    const visibleOptionCount = typeof customVisibleOptionCount === 'number' ? Math.min(customVisibleOptionCount, options.length) : options.length;
    const optionMap = new OptionMap(options);
    const defaultOption = typeof defaultValue === 'undefined' ? undefined : optionMap.get(defaultValue);
    let option = defaultOption && !defaultOption.disabled ? defaultOption : optionMap.first;
    while (option && option.disabled) {
        option = option.next;
    }
    return {
        optionMap,
        visibleOptionCount,
        visibleFromIndex: 0,
        visibleToIndex: visibleOptionCount - 1,
        value: option?.value,
        previousValue: option?.value,
    };
};
export const useSelectState = ({ visibleOptionCount, options, defaultValue }) => {
    const [state, dispatch] = useReducer(reducer, { visibleOptionCount, defaultValue, options }, createDefaultState);
    const [lastOptions, setLastOptions] = useState(options);
    const [lastVisibleOptionCount, setLastVisibleOptionCount] = useState(visibleOptionCount);
    if (options !== lastOptions && !isDeepStrictEqual(options, lastOptions)) {
        dispatch({
            type: 'reset',
            state: createDefaultState({ visibleOptionCount, defaultValue, options }),
        });
        setLastOptions(options);
    }
    if (visibleOptionCount !== lastVisibleOptionCount) {
        dispatch({
            type: 'reset',
            state: createDefaultState({ visibleOptionCount, defaultValue, options }),
        });
        setLastVisibleOptionCount(visibleOptionCount);
    }
    const selectNextOption = useCallback(() => {
        dispatch({
            type: 'select-next-option',
        });
    }, []);
    const selectPreviousOption = useCallback(() => {
        dispatch({
            type: 'select-previous-option',
        });
    }, []);
    const selectOption = useCallback(({ option }) => {
        dispatch({
            type: 'select-option',
            option,
        });
    }, []);
    const visibleOptions = useMemo(() => {
        return options.slice(state.visibleFromIndex);
    }, [options, state.visibleFromIndex]);
    return {
        visibleFromIndex: state.visibleFromIndex,
        visibleToIndex: state.visibleToIndex,
        value: state.value,
        visibleOptions,
        selectNextOption,
        selectPreviousOption,
        selectOption,
        previousValue: state.previousValue,
    };
};
//# sourceMappingURL=use-select-state.js.map