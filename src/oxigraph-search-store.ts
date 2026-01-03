import type * as rdfjs from "@rdfjs/types";
import type { Store } from "oxigraph";
import type { SearchStore } from "./search-store.ts";

/**
 * snapshotSparql is a SPARQL query that collects every string literal from
 * an RDF store.
 */
export const snapshotSparql = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

CONSTRUCT {
  ?subject ?predicate ?object
}
WHERE {
  {
    ?subject ?predicate ?object
  }
  UNION
  {
    GRAPH ?graph { ?subject ?predicate ?object }
  }
  FILTER (isLiteral(?object) && 
         ((datatype(?object) = xsd:string) ||
          (datatype(?object) = rdf:langString)))
}
`;

/**
 * OxigraphSearchStoreOptions are the query options for the OxigraphSearchStore.
 */
export type OxigraphSearchStoreOptions = Parameters<Store["query"]>[1];

/**
 * OxigraphSearchStore is a search store that uses Oxigraph as the underlying RDF store.
 */
export class OxigraphSearchStore implements SearchStore {
  public constructor(
    private readonly store: Store,
    private readonly options?: OxigraphSearchStoreOptions,
  ) {}

  public async *snapshot(): AsyncIterable<rdfjs.Quad> {
    yield* this.store.query(snapshotSparql, this.options) as rdfjs.Quad[];
  }
}
