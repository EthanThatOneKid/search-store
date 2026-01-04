import { Store } from "n3";
import type * as rdfjs from "@rdfjs/types";
import type { Patch } from "../patch.ts";

/**
 * createN3Proxy wraps a Store with a proxy that listens to changes and
 * emits patches.
 */
export function createN3Proxy(
  store: Store,
  subscribers: Set<(patch: Patch) => void>,
): Store {
  function emit(patch: Patch) {
    subscribers.forEach((subscriber) => subscriber(patch));
  }

  return new Proxy(store, {
    get(target, prop, _receiver) {
      // Intercept methods that modify the store
      switch (prop) {
        case "addQuad": {
          return (quad: rdfjs.Quad) => {
            const result = target[prop](quad);
            emit({
              insertions: [quad],
              deletions: [],
            });

            return result;
          };
        }

        case "addQuads": {
          return (quads: rdfjs.Quad[] | rdfjs.Dataset) => {
            const result = target[prop](quads as rdfjs.Quad[]);
            const insertions = Array.isArray(quads) ? quads : Array.from(quads);
            emit({
              insertions,
              deletions: [],
            });

            return result;
          };
        }

        case "removeQuad": {
          return (quad: rdfjs.Quad) => {
            const result = target[prop](quad);
            emit({
              insertions: [],
              deletions: [quad],
            });

            return result;
          };
        }

        case "removeQuads": {
          return (quads: rdfjs.Quad[]) => {
            const result = target[prop](quads);
            emit({
              insertions: [],
              deletions: [...quads],
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
