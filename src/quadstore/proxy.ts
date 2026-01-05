import type { Quadstore } from "quadstore";
import type * as rdfjs from "@rdfjs/types";
import type { PatchSink } from "#/rdf-patch/rdf-patch.ts";

/**
 * createQuadstoreProxy wraps a Quadstore with a proxy that listens to changes and
 * emits patches.
 */
export function createQuadstoreProxy(
  store: Quadstore,
  patchSink: PatchSink,
): Quadstore {
  return new Proxy(store, {
    get(target, prop, _receiver) {
      // Intercept methods that modify the store
      switch (prop) {
        case "put": {
          return async (quad: rdfjs.Quad) => {
            const result = await target[prop](quad);
            // Fire and forget - promise chain in patchSink ensures sequential processing
            patchSink.patch({
              insertions: [quad],
              deletions: [],
            });

            return result;
          };
        }

        case "multiPut": {
          return async (quads: rdfjs.Quad[]) => {
            const result = await target[prop](quads);
            // Fire and forget - promise chain in patchSink ensures sequential processing
            patchSink.patch({
              insertions: quads,
              deletions: [],
            });

            return result;
          };
        }

        case "del": {
          return async (quad: rdfjs.Quad) => {
            const result = await target[prop](quad);
            // Fire and forget - promise chain in patchSink ensures sequential processing
            patchSink.patch({
              insertions: [],
              deletions: [quad],
            });

            return result;
          };
        }

        case "multiDel": {
          return async (quads: rdfjs.Quad[]) => {
            const result = await target[prop](quads);
            // Fire and forget - promise chain in patchSink ensures sequential processing
            patchSink.patch({
              insertions: [],
              deletions: quads,
            });

            return result;
          };
        }

        default: {
          return target[prop as keyof typeof target];
        }
      }
    },
  });
}
