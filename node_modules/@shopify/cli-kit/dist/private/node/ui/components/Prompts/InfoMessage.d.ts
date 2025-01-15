import { InlineToken, LinkToken, TokenItem, UserInputToken } from '../TokenizedText.js';
import { TextProps } from 'ink';
import { FunctionComponent } from 'react';
export interface InfoMessageProps {
    message: {
        title: {
            color?: TextProps['color'];
            text: TokenItem<Exclude<InlineToken, UserInputToken | LinkToken>>;
        };
        body: TokenItem;
    };
}
declare const InfoMessage: FunctionComponent<InfoMessageProps>;
export { InfoMessage };
