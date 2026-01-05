import { assertEquals } from "@std/assert";
import { DataFactory } from "rdf-data-factory";
import type { Patch } from "#/rdf-patch/rdf-patch.ts";
import { QuadstorePatchSource } from "./patch-source.ts";
import { createTestQuadstore } from "./test-helpers.ts";

Deno.test("QuadstorePatchSource.subscribe notifies subscribers when patches are received", async () => {
  const store = await createTestQuadstore();
  const df = new DataFactory();

  const patchSource = new QuadstorePatchSource(store);

  const receivedPatches: Patch[] = [];
  const unsubscribe = patchSource.subscribe((patch) => {
    receivedPatches.push(patch);
  });

  const quad = df.quad(
    df.namedNode("https://example.org/s"),
    df.namedNode("https://example.org/p"),
    df.literal("o"),
  );

  // Add a quad through the proxied store, which should trigger a patch
  await patchSource.store.put(quad);

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 10));

  assertEquals(receivedPatches.length, 1);
  assertEquals(receivedPatches[0].insertions.length, 1);
  assertEquals(receivedPatches[0].insertions[0], quad);
  assertEquals(receivedPatches[0].deletions.length, 0);

  unsubscribe();
  await store.close();
});

Deno.test("QuadstorePatchSource.subscribe supports multiple subscribers", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patchSource = new QuadstorePatchSource(store);

  const receivedPatches1: Patch[] = [];
  const receivedPatches2: Patch[] = [];

  const unsubscribe1 = patchSource.subscribe((patch) => {
    receivedPatches1.push(patch);
  });
  const unsubscribe2 = patchSource.subscribe((patch) => {
    receivedPatches2.push(patch);
  });

  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o"),
  );

  await patchSource.store.put(quad);

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 10));

  assertEquals(receivedPatches1.length, 1);
  assertEquals(receivedPatches2.length, 1);
  assertEquals(receivedPatches1[0].insertions[0], quad);
  assertEquals(receivedPatches2[0].insertions[0], quad);

  unsubscribe1();
  unsubscribe2();
  await store.close();
});

Deno.test("QuadstorePatchSource.subscribe unsubscribe stops receiving patches", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patchSource = new QuadstorePatchSource(store);

  const receivedPatches: Patch[] = [];
  const unsubscribe = patchSource.subscribe((patch) => {
    receivedPatches.push(patch);
  });

  const quad1 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s1"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o1"),
  );

  await patchSource.store.put(quad1);

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 10));

  assertEquals(receivedPatches.length, 1);

  // Unsubscribe
  unsubscribe();

  const quad2 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s2"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o2"),
  );

  await patchSource.store.put(quad2);

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Should still only have 1 patch (the one before unsubscribe)
  assertEquals(receivedPatches.length, 1);

  await store.close();
});

Deno.test("QuadstorePatchSource.subscribe supports async subscribers", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patchSource = new QuadstorePatchSource(store);

  const receivedPatches: Patch[] = [];
  const processingOrder: number[] = [];
  let processingCount = 0;

  patchSource.subscribe(async (patch) => {
    const currentCount = ++processingCount;
    processingOrder.push(currentCount);
    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 10));
    receivedPatches.push(patch);
  });

  const quad1 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s1"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o1"),
  );
  const quad2 = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s2"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o2"),
  );

  await patchSource.store.put(quad1);
  await patchSource.store.put(quad2);

  // Wait for async processing
  await new Promise((resolve) => setTimeout(resolve, 50));

  assertEquals(receivedPatches.length, 2);
  assertEquals(processingOrder.length, 2);
  // Patches should be processed sequentially
  assertEquals(processingOrder[0], 1);
  assertEquals(processingOrder[1], 2);

  await store.close();
});
