import { assertEquals } from "@std/assert";
import { literal, namedNode, quad, Store } from "oxigraph";
import { OxigraphSearchStore } from "./oxigraph-search-store.ts";
import { assertQuadEquals } from "./utils.ts";

Deno.test("OxigraphSearchStore gets string literals", async () => {
  const fakeQuad = quad(
    namedNode("https://etok.me"),
    namedNode("http://schema.org/givenName"),
    literal("Ethan"),
  );

  const store = new Store();
  store.add(fakeQuad);

  const searchStore = new OxigraphSearchStore(store);
  const actual = await Array.fromAsync(searchStore.snapshot());

  assertEquals(actual.length, 1);
  assertQuadEquals(fakeQuad, actual[0]);
});
