/** Link to the print preview page for one or more orders. */
export function printOrdersUrl(ids: string[], doc: "label" | "invoice") {
  return `/print/orders?ids=${encodeURIComponent(ids.join(","))}&doc=${doc}`;
}
