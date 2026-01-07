# search-store

RDF Store extended with cutting-edge search capabilities.

## Overview

**search-store** adds full-text and semantic search capabilities to RDF
knowledge graphs, with real-time synchronization as the graph changes.

### Architecture

- **`PatchProxy`** interface wraps RDF stores to monitor changes and emit
  patches via `PatchPusher`
- **`SearchStore`** interface consumes patches via `PatchPusher` and provides
  search functionality
- **`Embedder`** interface provides optional vector embeddings for semantic
  search

Proof-of-concept implementations exist for each interface, but the architecture
is defined by these interfaces rather than specific implementations.

### Key Features

- **Patch-based updates**: Tracks insertions and deletions of RDF quads
- **Hybrid search**: Combines text search with vector embeddings (RRF) when an
  `Embedder` is provided
- **Real-time synchronization**: `PatchProxy` wraps RDF stores to automatically
  emit patches on changes
- **Sequential processing**: Patches are processed in order to maintain
  consistency
- **String literal indexing**: Only string literals (language-tagged or plain)
  are indexed for search

### Use Case

Add full-text and semantic search to RDF knowledge graphs, with automatic
updates as the graph changes.

## RDF 1.1 Notes

- A literal cannot have both a language tag and a datatype
- Language-tagged literals are `rdf:langString` (string type)
- Plain literals (no datatype) are treated as `xsd:string`

---

Developed with 🧪 [**@FartLabs**](https://fartlabs.org/)
