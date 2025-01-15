import { getArrayContainsDuplicates, getArrayRejectingUndefined } from '../common/array.js';
/**
 * Convenience function to trigger a hook, and gather any successful responses. Failures are ignored.
 *
 * Responses are organised into a dictionary, keyed by plug-in name.
 * Only plug-ins that have hooks registered for the given event, and the hooks were run successfully, are included.
 *
 * @param config - The oclif config object.
 * @param event - The name of the hook to trigger.
 * @param options - The options to pass to the hook.
 * @param timeout - The timeout to use for the hook.
 * @returns A dictionary of plug-in names to the response from the hook.
 */
export async function fanoutHooks(config, event, options, timeout) {
    const res = await config.runHook(event, options, timeout);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.fromEntries(res.successes.map(({ result, plugin }) => [plugin.name, result]));
}
/**
 * Execute the 'tunnel_provider' hook, and return the list of available tunnel providers.
 * Fail if there are multiple plugins for the same provider.
 *
 * @param config - Oclif config used to execute hooks.
 * @returns List of available tunnel plugins.
 */
export async function getListOfTunnelPlugins(config) {
    const hooks = await fanoutHooks(config, 'tunnel_provider', {});
    const names = getArrayRejectingUndefined(Object.values(hooks).map((key) => key?.name));
    if (getArrayContainsDuplicates(names))
        return { plugins: names, error: 'multiple-plugins-for-provider' };
    return { plugins: names };
}
//# sourceMappingURL=plugins.js.map