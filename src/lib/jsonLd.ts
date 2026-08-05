/**
 * Serialises a JSON-LD object for embedding in a <script type="application/ld+json"> tag.
 *
 * JSON.stringify does NOT escape "</script>", so any value that reaches the
 * document — product names and descriptions come from the admin panel — could
 * close the tag early and inject markup. Escaping < > & as unicode keeps the
 * payload valid JSON (parsers decode < back to "<") while making it
 * impossible to break out of the script element or open an HTML comment.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
