import { TokenizedText } from '../TokenizedText.js';
import { Box, Text } from 'ink';
import React from 'react';
const InfoMessage = ({ message: { title: { color, text: title }, body, }, }) => {
    return (React.createElement(Box, { flexDirection: "column", gap: 1 },
        React.createElement(Text, { color: color },
            React.createElement(TokenizedText, { item: title })),
        React.createElement(TokenizedText, { item: body })));
};
export { InfoMessage };
//# sourceMappingURL=InfoMessage.js.map