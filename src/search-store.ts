import type * as rdfjs from "@rdfjs/types";

/**
 * SearchStore is a search store that enables efficient searching of RDF data.
 */
export interface SearchStore<TQuad extends rdfjs.BaseQuad = rdfjs.Quad> {
  /**
   * snapshot snapshots every quad with a string literal in the quad object.
   */
  snapshot(): AsyncIterable<TQuad>;
}
