"""
Vector Store — ChromaDB interface for book embeddings.
"""
import os
import chromadb
from chromadb.config import Settings
from django.conf import settings


def get_chroma_client():
    """Returns a persistent ChromaDB client."""
    persist_dir = getattr(settings, 'CHROMA_PERSIST_DIR', './chroma_db')
    os.makedirs(persist_dir, exist_ok=True)
    client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False)
    )
    return client


def get_collection(client=None):
    """Gets or creates the 'books' collection."""
    if client is None:
        client = get_chroma_client()
    collection = client.get_or_create_collection(
        name='books',
        metadata={"hnsw:space": "cosine"}
    )
    return collection


def add_chunks(book_id: int, chunks: list[str], embeddings: list[list[float]]) -> list[str]:
    """
    Adds text chunks and their embeddings to ChromaDB.
    Returns list of embedding IDs.
    """
    collection = get_collection()
    ids = [f"book_{book_id}_chunk_{i}" for i in range(len(chunks))]

    # Upsert so re-indexing is idempotent
    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"book_id": book_id, "chunk_index": i} for i in range(len(chunks))]
    )
    return ids


def similarity_search(query_embedding: list[float], n_results: int = 5, book_id: int = None) -> dict:
    """
    Performs cosine similarity search in ChromaDB.
    Optionally filters by book_id.
    Returns the top-k results with documents and metadata.
    """
    collection = get_collection()
    where = {"book_id": book_id} if book_id else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where,
        include=["documents", "metadatas", "distances"]
    )
    return results


def delete_book_chunks(book_id: int):
    """Removes all chunks for a given book from ChromaDB."""
    collection = get_collection()
    results = collection.get(where={"book_id": book_id})
    if results and results.get('ids'):
        collection.delete(ids=results['ids'])


def get_collection_count() -> int:
    """Returns the total number of chunks stored."""
    collection = get_collection()
    return collection.count()
