/// <reference types="react" />
export declare enum PromptState {
    Idle = "idle",
    Loading = "loading",
    Submitted = "submitted",
    Error = "error",
    Cancelled = "cancelled"
}
interface UsePromptProps<T> {
    initialAnswer: T;
}
export default function usePrompt<T>({ initialAnswer }: UsePromptProps<T>): {
    promptState: PromptState;
    setPromptState: import("react").Dispatch<import("react").SetStateAction<PromptState>>;
    answer: T;
    setAnswer: import("react").Dispatch<import("react").SetStateAction<T>>;
};
export {};
