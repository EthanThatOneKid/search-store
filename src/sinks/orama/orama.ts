import type * as rdfjs from "@rdfjs/types";
import { create, insertMultiple, removeMultiple, search } from "@orama/orama";
import { DataFactory } from "n3";
import type { RankedResult, SearchStore } from "../../search-store.ts";
import type { Patch, PatchSink } from "../../patch.ts";
import { skolemizeQuad } from "../../skolem.ts";

/**
 * Orama is the type of our Orama instance.
 */
export type Orama = ReturnType<typeof createOrama>;

/**
 * createOrama creates a new Orama instance.
 */
export function createOrama(vectorSize: number) {
  return create({
    schema: {
      id: "string",
      subject: "string",
      predicate: "string",
      object: "string",
      graph: "string",
      embedding: `vector[${vectorSize}]`,
    },
  });
}

/**
 * OramaEmbedder embeds text into a vector space.
 */
export interface OramaEmbedder {
  embed(text: string): Promise<number[]>;
}

/**
 * OramaStore is a store that can be searched and patched.
 */
export class OramaSearchStore implements SearchStore, PatchSink {
  public constructor(
    private readonly orama: Orama,
    //
    // TODO: Disable vector search by leaving the embedder undefined.
    private readonly embedder: OramaEmbedder,
  ) {}

  /**
   * @see https://docs.orama.com/docs/orama-js/search/hybrid-search#performing-hybrid-search
   */
  public async search(
    query: string,
    limit?: number,
  ): Promise<RankedResult<rdfjs.NamedNode>[]> {
    // Handle empty query - return empty array
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Generate embedding for the query
    const embedding = await this.embedder.embed(query);

    // Perform hybrid search using Orama's built-in hybrid mode
    const results = await search(this.orama, {
      mode: "hybrid",
      term: query,
      vector: {
        value: embedding,
        property: "embedding",
      },
      limit: limit ?? 10,
      includeVectors: false,
    });

    // Convert Orama hits to RankedResult<rdfjs.NamedNode>[]
    return results.hits.map((hit, index) => {
      const document = hit.document as {
        subject: string;
        predicate: string;
        object: string;
        graph: string;
      };

      return {
        rank: index + 1,
        score: hit.score,
        value: DataFactory.namedNode(document.subject),
      };
    });
  }

  public async patch(patch: Patch): Promise<void> {
    await this.applyDeletions(patch.deletions);
    await this.applyInsertions(patch.insertions);
  }

  private async applyDeletions(deletions: rdfjs.Quad[]): Promise<void> {
    const deletedDocumentIds = await Promise.all(
      deletions.map((deletion) => skolemizeQuad(deletion)),
    );

    await removeMultiple(this.orama, deletedDocumentIds);
  }

  private async applyInsertions(insertions: rdfjs.Quad[]): Promise<void> {
    const insertedDocuments = await Promise.all(
      insertions.map(async (insertion) => {
        const documentId = await skolemizeQuad(insertion);
        const embedding = await this.embedder.embed(insertion.object.value);
        return {
          id: documentId,
          subject: insertion.subject.value,
          predicate: insertion.predicate.value,
          object: insertion.object.value,
          graph: insertion.graph?.value ?? "",
          embedding,
        };
      }),
    );

    await insertMultiple(this.orama, insertedDocuments);
  }
}
