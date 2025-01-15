import { useState } from 'react';
export var PromptState;
(function (PromptState) {
    PromptState["Idle"] = "idle";
    PromptState["Loading"] = "loading";
    PromptState["Submitted"] = "submitted";
    PromptState["Error"] = "error";
    PromptState["Cancelled"] = "cancelled";
})(PromptState || (PromptState = {}));
export default function usePrompt({ initialAnswer }) {
    const [promptState, setPromptState] = useState(PromptState.Idle);
    const [answer, setAnswer] = useState(initialAnswer);
    return {
        promptState,
        setPromptState,
        answer,
        setAnswer,
    };
}
//# sourceMappingURL=use-prompt.js.map