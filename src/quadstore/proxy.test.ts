import { assertEquals } from "@std/assert";
import { DataFactory } from "rdf-data-factory";
import type { Patch } from "#/rdf-patch/rdf-patch.ts";
import { createQuadstoreProxy } from "./proxy.ts";
import { createTestQuadstore } from "./test-helpers.ts";

Deno.test("createQuadstoreProxy notifies subscribers when put is called", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o"),
  );

  await proxiedStore.put(quad);

  assertEquals(patches.length, 1);
  assertEquals(patches[0].insertions.length, 1);
  assertEquals(patches[0].insertions[0], quad);
  assertEquals(patches[0].deletions.length, 0);

  await store.close();
});

Deno.test("createQuadstoreProxy notifies subscribers when multiPut is called", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

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

  await proxiedStore.multiPut([quad1, quad2]);

  assertEquals(patches.length, 1);
  assertEquals(patches[0].insertions.length, 2);
  assertEquals(patches[0].insertions[0], quad1);
  assertEquals(patches[0].insertions[1], quad2);
  assertEquals(patches[0].deletions.length, 0);

  await store.close();
});

Deno.test("createQuadstoreProxy notifies subscribers when del is called", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o"),
  );

  await proxiedStore.put(quad);
  patches.length = 0; // Clear patches

  await proxiedStore.del(quad);

  assertEquals(patches.length, 1);
  assertEquals(patches[0].deletions.length, 1);
  assertEquals(patches[0].deletions[0], quad);
  assertEquals(patches[0].insertions.length, 0);

  await store.close();
});

Deno.test("createQuadstoreProxy notifies subscribers when multiDel is called", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

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

  await proxiedStore.multiPut([quad1, quad2]);
  patches.length = 0; // Clear patches

  await proxiedStore.multiDel([quad1, quad2]);

  assertEquals(patches.length, 1);
  assertEquals(patches[0].deletions.length, 2);
  assertEquals(patches[0].deletions[0], quad1);
  assertEquals(patches[0].deletions[1], quad2);
  assertEquals(patches[0].insertions.length, 0);

  await store.close();
});

Deno.test("createQuadstoreProxy notifies all subscribers", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches1: Patch[] = [];
  const patches2: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches1.push(patch);
      patches2.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o"),
  );

  await proxiedStore.put(quad);

  assertEquals(patches1.length, 1);
  assertEquals(patches2.length, 1);
  assertEquals(patches1[0].insertions[0], quad);
  assertEquals(patches2[0].insertions[0], quad);

  await store.close();
});

Deno.test("createQuadstoreProxy forwards non-mutating methods correctly", async () => {
  const store = await createTestQuadstore();
  const dataFactory = new DataFactory();

  const patches: Patch[] = [];
  const patchSink = {
    patch(patch: Patch): Promise<void> {
      patches.push(patch);
      return Promise.resolve();
    },
  };

  const proxiedStore = createQuadstoreProxy(store, patchSink);

  const quad = dataFactory.quad(
    dataFactory.namedNode("https://example.org/s"),
    dataFactory.namedNode("https://example.org/p"),
    dataFactory.literal("o"),
  );

  await store.put(quad);

  // match should not trigger patches
  const stream = proxiedStore.match(undefined, undefined, undefined, undefined);
  const quads: typeof quad[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (q: typeof quad) => quads.push(q));
    stream.on("end", () => resolve());
    stream.on("error", (err: Error) => reject(err));
  });

  assertEquals(quads.length, 1);
  assertEquals(patches.length, 0);

  await store.close();
});
