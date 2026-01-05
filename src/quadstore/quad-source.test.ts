import { assert, assertEquals } from "@std/assert";
import { DataFactory } from "rdf-data-factory";
import type * as rdfjs from "@rdfjs/types";
import { QuadstoreQuadSource } from "./quad-source.ts";
import { createTestQuadstore } from "./test-helpers.ts";

Deno.test("QuadstoreQuadSource.getQuads includes language-tagged literals (rdf:langString)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a language-tagged literal
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.literal("Hello", "en"),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 1);
  // Compare quad properties since Quadstore may return different quad instances
  assertEquals(quads[0].subject.value, quad.subject.value);
  assertEquals(quads[0].predicate.value, quad.predicate.value);
  assertEquals(quads[0].object.value, quad.object.value);
  if (
    quads[0].object.termType === "Literal" && quad.object.termType === "Literal"
  ) {
    assertEquals(quads[0].object.language, quad.object.language);
  }

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads includes plain literals (no datatype)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a plain literal (no datatype)
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.literal("Hello"),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 1);
  // Compare quad properties
  assertEquals(quads[0].subject.value, quad.subject.value);
  assertEquals(quads[0].predicate.value, quad.predicate.value);
  assertEquals(quads[0].object.value, quad.object.value);

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads includes typed string literals (xsd:string)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a typed string literal
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.literal(
      "Hello",
      dataFactory.namedNode("http://www.w3.org/2001/XMLSchema#string"),
    ),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 1);
  // Compare quad properties
  assertEquals(quads[0].subject.value, quad.subject.value);
  assertEquals(quads[0].predicate.value, quad.predicate.value);
  assertEquals(quads[0].object.value, quad.object.value);
  if (
    quads[0].object.termType === "Literal" && quad.object.termType === "Literal"
  ) {
    assertEquals(quads[0].object.datatype?.value, quad.object.datatype?.value);
  }

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads excludes non-string typed literals (xsd:integer)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a typed integer literal
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.literal(
      "42",
      dataFactory.namedNode("http://www.w3.org/2001/XMLSchema#integer"),
    ),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 0);

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads excludes non-string typed literals (xsd:boolean)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a typed boolean literal
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.literal(
      "true",
      dataFactory.namedNode("http://www.w3.org/2001/XMLSchema#boolean"),
    ),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 0);

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads excludes non-literal objects (NamedNode)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a quad with a NamedNode as object
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.namedNode("https://example.org/object"),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 0);

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads excludes non-literal objects (BlankNode)", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add a quad with a BlankNode as object
  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/subject"),
    dataFactory.namedNode("https://example.org/predicate"),
    dataFactory.blankNode("b1"),
  );
  await store.put(quad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 0);

  await store.close();
});

Deno.test("QuadstoreQuadSource.getQuads filters mixed quads correctly", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const source = new QuadstoreQuadSource(store);

  // Add various types of quads
  const stringQuad1 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s1"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("Hello", "en"), // language-tagged
  );
  const stringQuad2 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s2"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("World"), // plain literal
  );
  const stringQuad3 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s3"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal(
      "Test",
      dataFactory.namedNode("http://www.w3.org/2001/XMLSchema#string"),
    ), // typed string
  );
  const integerQuad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s4"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal(
      "42",
      dataFactory.namedNode("http://www.w3.org/2001/XMLSchema#integer"),
    ), // typed integer
  );
  const namedNodeQuad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s5"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.namedNode("https://example.org/o"), // NamedNode
  );

  await store.put(stringQuad1);
  await store.put(stringQuad2);
  await store.put(stringQuad3);
  await store.put(integerQuad);
  await store.put(namedNodeQuad);

  const quads: rdfjs.Quad[] = [];
  for await (const q of source.getQuads()) {
    quads.push(q);
  }

  assertEquals(quads.length, 3);

  // Helper to check if a quad matches by comparing its object value
  const hasQuadWithObject = (quads: rdfjs.Quad[], expectedObject: string) => {
    return quads.some((q: rdfjs.Quad) =>
      q.object.termType === "Literal" && q.object.value === expectedObject
    );
  };

  // Verify all three string quads are included by checking their object values
  assert(hasQuadWithObject(quads, "Hello"));
  assert(hasQuadWithObject(quads, "World"));
  assert(hasQuadWithObject(quads, "Test"));

  // Verify non-string quads are excluded
  assert(!hasQuadWithObject(quads, "42"));
  // Check that no quads have NamedNode objects
  assert(
    !quads.some((q: rdfjs.Quad) => q.object.termType === "NamedNode"),
  );

  await store.close();
});
