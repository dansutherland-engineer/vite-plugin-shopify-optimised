import { shouldDisplayColors } from '../../../../public/node/output.js';
import { Box, Text } from 'ink';
import React from 'react';
const BACKGROUND_CHAR = '│';
const SCROLLBOX_CHAR = '║';
const Scrollbar = ({ containerHeight, visibleListSectionLength, fullListLength, visibleFromIndex, noColor = !shouldDisplayColors(), }) => {
    const displayArrows = containerHeight >= 4 && noColor;
    const visibleToIndex = visibleFromIndex + visibleListSectionLength - 1;
    // Leave 2 rows for top/bottom arrows when there is vertical room for them.
    const fullHeight = displayArrows ? containerHeight - 2 : containerHeight;
    const scrollboxHeight = Math.min(fullHeight - 1, Math.ceil(Math.min(1, visibleListSectionLength / fullListLength) * fullHeight));
    let topBuffer;
    // Ensure it scrolls all the way to the bottom when we hit the bottom
    if (visibleToIndex >= fullListLength - 1) {
        topBuffer = fullHeight - scrollboxHeight;
    }
    else {
        // This is the actual number of rows available for the scrollbar to go up and down
        const scrollingLength = fullHeight - scrollboxHeight;
        // This is the number of times the screen itself can scroll down
        const scrollableIncrements = fullListLength - visibleListSectionLength;
        topBuffer = Math.max(
        // Never go negative, that causes errors!
        0, Math.min(
        // Never have more buffer than filling in all spaces above the scrollbox
        fullHeight - scrollboxHeight, Math.round((visibleFromIndex / scrollableIncrements) * scrollingLength)));
    }
    const bottomBuffer = fullHeight - scrollboxHeight - topBuffer;
    const backgroundChar = noColor ? BACKGROUND_CHAR : ' ';
    const scrollboxChar = noColor ? SCROLLBOX_CHAR : ' ';
    const bgColor = noColor ? undefined : 'gray';
    const scrollboxColor = noColor ? undefined : 'cyan';
    return (React.createElement(Box, { flexDirection: "column" },
        displayArrows ? React.createElement(Text, null, "\u25B3") : null,
        React.createElement(Box, { width: 1 },
            React.createElement(Text, { backgroundColor: bgColor }, backgroundChar.repeat(topBuffer))),
        React.createElement(Box, { width: 1 },
            React.createElement(Text, { backgroundColor: scrollboxColor }, scrollboxChar.repeat(scrollboxHeight))),
        React.createElement(Box, { width: 1 },
            React.createElement(Text, { backgroundColor: bgColor }, backgroundChar.repeat(bottomBuffer))),
        displayArrows ? React.createElement(Text, null, "\u25BD") : null));
};
export { Scrollbar };
//# sourceMappingURL=Scrollbar.js.map