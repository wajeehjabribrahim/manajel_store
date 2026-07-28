/**
 * Controls whether prices are published to search engines and AI answer engines.
 *
 * While the store is unlaunched the catalogue still carries placeholder prices,
 * and anything written into JSON-LD gets indexed and cached by Google, Bing and
 * AI models — wrong prices are far harder to retract than to withhold. So offers
 * are omitted from structured data until this is explicitly switched on.
 *
 * Default is "not launched" on purpose: forgetting to set it costs a rich-result
 * enhancement, whereas the opposite default would publish wrong prices.
 *
 * On launch day set STORE_LAUNCHED="true" in the environment and redeploy.
 */
export const STORE_LAUNCHED = process.env.STORE_LAUNCHED === "true";
