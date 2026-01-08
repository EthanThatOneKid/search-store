import type * as rdfjs from "@rdfjs/types";

/**
 * Patch is a batch of RDF/JS store changes.
 *
 * @see https://www.w3.org/DesignIssues/Diff.html
 */
export interface Patch {
  /**
   * insertions are the quads that were added.
   */
  insertions: rdfjs.Quad[];

  /**
   * deletions are the quads that were removed.
   */
  deletions: rdfjs.Quad[];
}

/**
 * PatchHandler handlers a series of patches.
 */
export interface PatchHandler {
  /**
   * patch handles a series of patches.
   */
  patch(patches: Patch[]): Promise<void>;
}

/**
 * PatchHandlerSync handles a series of patches synchronously.
 */
export interface PatchHandlerSync {
  /**
   * patch handles a series of patches synchronously.
   */
  patch(patches: Patch[]): void;
}
