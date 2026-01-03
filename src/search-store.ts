import type * as rdfjs from "@rdfjs/types";

/**
 * SearchStore is a store that can be searched.
 */
export interface SearchStore {
  /**
   * search searches the store for quads matching the query.
   */
  search(query: string): Promise<RankedResult<rdfjs.Quad>[]>;
}

/**
 * RankedResult is a result with a score.
 */
export interface RankedResult<T> {
  /**
   * score is the score of the result.
   */
  score: number;

  /**
   * value is the result value.
   */
  value: T;
}
