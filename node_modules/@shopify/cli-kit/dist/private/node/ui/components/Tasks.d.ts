import { AbortSignal } from '../../../../public/node/abort.js';
import React from 'react';
export interface Task<TContext = unknown> {
    title: string;
    task: (ctx: TContext, task: Task<TContext>) => Promise<void | Task<TContext>[]>;
    retry?: number;
    retryCount?: number;
    errors?: Error[];
    skip?: (ctx: TContext) => boolean;
}
export interface TasksProps<TContext> {
    tasks: Task<TContext>[];
    silent?: boolean;
    onComplete?: (ctx: TContext) => void;
    abortSignal?: AbortSignal;
}
declare function Tasks<TContext>({ tasks, silent, onComplete, abortSignal, }: React.PropsWithChildren<TasksProps<TContext>>): JSX.Element | null;
export { Tasks };
