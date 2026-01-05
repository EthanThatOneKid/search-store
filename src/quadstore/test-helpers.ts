import { DataFactory } from "rdf-data-factory";
import { MemoryLevel } from "memory-level";
import { Quadstore } from "quadstore";

/**
 * createTestQuadstore creates an in-memory Quadstore instance for testing.
 * The store is already opened and ready to use.
 */
export async function createTestQuadstore(): Promise<Quadstore> {
  const backend = new MemoryLevel();
  const dataFactory = new DataFactory();
  // deno-lint-ignore no-explicit-any
  const store = new Quadstore({ backend, dataFactory: dataFactory as any });
  await store.open();
  return store;
}
