import { DataFactory, Store } from "n3";
import { QueryEngine } from "@comunica/query-sparql-rdfjs-lite";
import { createOrama, OramaSearchStore } from "./orama.ts";
import { proxyN3 } from "./n3.ts";
import solarSytemSparql from "./solar-system.sparql" with { type: "text" };

// Create search store.
const orama = createOrama();
const searchStore = new OramaSearchStore({
  dataFactory: DataFactory,
  orama,
});

// Create an RDF store and connect it to the search store.
const n3Store = new Store();
const patchProxy = proxyN3(n3Store, searchStore);

// Create a query engine.
const queryEngine = new QueryEngine();

// Ensure the query executes.
const queryResult = await queryEngine.query(solarSytemSparql, {
  sources: [patchProxy],
});
await queryResult.execute();

// Sync the search store with the RDF store.
await searchStore.pull();

// Search the search store.
const rankedResults = await searchStore.search(
  "What is the name of the planet with the largest radius?",
);
console.log({ rankedResults });
