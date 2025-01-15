/* eslint-disable id-length */
import { Text } from 'ink';
import React, { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import gradient from 'gradient-string';
function rainbow(text, frame) {
    const hue = 5 * frame;
    const leftColor = { h: hue % 360, s: 0.8, v: 1 };
    const rightColor = { h: (hue + 1) % 360, s: 0.8, v: 1 };
    return gradient(leftColor, rightColor)(text, { interpolation: 'hsv', hsvSpin: 'long' });
}
/**
 * `TextAnimation` applies a rainbow animation to text.
 */
const TextAnimation = memo(({ text }) => {
    const frame = useRef(0);
    const [renderedFrame, setRenderedFrame] = useState(text);
    const timeout = useRef();
    const renderAnimation = useCallback(() => {
        const newFrame = frame.current + 1;
        frame.current = newFrame;
        setRenderedFrame(rainbow(text, frame.current));
        timeout.current = setTimeout(() => {
            renderAnimation();
        }, 35);
    }, [text]);
    useLayoutEffect(() => {
        renderAnimation();
        return () => {
            clearTimeout(timeout.current);
        };
    }, [renderAnimation]);
    return React.createElement(Text, null, renderedFrame);
});
TextAnimation.displayName = 'TextAnimation';
export { TextAnimation };
//# sourceMappingURL=TextAnimation.js.map