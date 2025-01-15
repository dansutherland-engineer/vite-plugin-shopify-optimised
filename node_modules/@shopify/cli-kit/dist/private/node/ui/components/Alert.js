import { Banner } from './Banner.js';
import { Link } from './Link.js';
import { List } from './List.js';
import { TokenizedText } from './TokenizedText.js';
import { Box, Text } from 'ink';
import React from 'react';
const Alert = ({ type, headline, body, nextSteps, reference, link, customSections, orderedNextSteps = false, }) => {
    return (React.createElement(Banner, { type: type },
        headline ? (React.createElement(Text, { bold: true },
            React.createElement(TokenizedText, { item: headline }))) : null,
        body ? React.createElement(TokenizedText, { item: body }) : null,
        nextSteps && nextSteps.length > 0 ? (React.createElement(List, { title: "Next steps", items: nextSteps, ordered: orderedNextSteps })) : null,
        reference && reference.length > 0 ? React.createElement(List, { title: "Reference", items: reference }) : null,
        link ? React.createElement(Link, { url: link.url, label: link.label }) : null,
        customSections && customSections.length > 0 ? (React.createElement(Box, { flexDirection: "column", gap: 1 }, customSections.map((section, index) => (React.createElement(Box, { key: index, flexDirection: "column" },
            section.title ? React.createElement(Text, { bold: true }, section.title) : null,
            React.createElement(TokenizedText, { item: section.body })))))) : null));
};
export { Alert };
//# sourceMappingURL=Alert.js.map