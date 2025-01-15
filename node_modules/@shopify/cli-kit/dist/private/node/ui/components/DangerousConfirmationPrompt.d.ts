import { InfoTableProps } from './Prompts/InfoTable.js';
import { AbortSignal } from '../../../../public/node/abort.js';
import { FunctionComponent } from 'react';
export interface DangerousConfirmationPromptProps {
    message: string;
    confirmation: string;
    infoTable?: InfoTableProps['table'];
    onSubmit: (value: boolean) => void;
    abortSignal?: AbortSignal;
}
declare const DangerousConfirmationPrompt: FunctionComponent<DangerousConfirmationPromptProps>;
export { DangerousConfirmationPrompt };
