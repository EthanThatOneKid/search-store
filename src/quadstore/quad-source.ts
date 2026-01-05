import type { Quadstore } from "quadstore";
import type * as rdfjs from "@rdfjs/types";
import type { QuadSource } from "#/rdf-patch/quad-source.ts";

/**
 * QuadstoreQuadSource is a source that provides quads from a Quadstore store.
 * It filters quads to only include string literals (language-tagged, plain, or xsd:string typed).
 */
export class QuadstoreQuadSource implements QuadSource {
  public readonly store: Quadstore;

  public constructor(store: Quadstore) {
    this.store = store;
  }

  public async *getQuads(): AsyncIterable<rdfjs.Quad> {
    // Quadstore's match() returns a stream, so we need to collect it
    const stream = this.store.match(undefined, undefined, undefined, undefined);
    const quads: rdfjs.Quad[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (quad: rdfjs.Quad) => {
        quads.push(quad);
      });
      stream.on("end", () => {
        resolve();
      });
      stream.on("error", (err: Error) => {
        reject(err);
      });
    });

    // Filter to only include string literals
    const filteredQuads = quads.filter((quad) => {
      if (quad.object.termType !== "Literal") {
        return false;
      }

      return (
        quad.object.language ||
        (!quad.object.datatype ||
          quad.object.datatype.value ===
            "http://www.w3.org/2001/XMLSchema#string")
      );
    });

    yield* filteredQuads;
  }
}
