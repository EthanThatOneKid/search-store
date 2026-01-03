import type * as rdfjs from "@rdfjs/types";
import type { RankedResult, SearchStore } from "../search-store.ts";
import type { Patch, PatchSink } from "../patch.ts";

/**
 * OramaStore is a store that can be searched and patched.
 */
export class OramaStore implements SearchStore, PatchSink {
  public async applyPatches(patches: AsyncIterable<Patch>): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async search(query: string): Promise<RankedResult<rdfjs.Quad>[]> {
    throw new Error("Method not implemented.");
  }
}
