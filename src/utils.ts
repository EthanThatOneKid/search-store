import type * as rdfjs from "@rdfjs/types";
import { assert } from "@std/assert";

/**
 * assertQuadEquals asserts that two RDF quads are equal.
 */
export function assertQuadEquals(expected: rdfjs.Quad, actual: rdfjs.Quad) {
  assert(expected.equals(actual));
}
