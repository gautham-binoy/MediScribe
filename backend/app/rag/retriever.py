from pathlib import Path
from typing import Any

from app.core.config import settings
from app.rag.indexer import RAGIndexer

DOCS_DIR = Path(__file__).resolve().parent / "documents"
_indexer: RAGIndexer | None = None


def get_rag_indexer() -> RAGIndexer:
    global _indexer
    if _indexer is None:
        _indexer = RAGIndexer(DOCS_DIR)
    return _indexer


def retrieve_guidelines(query: str, top_k: int = 3) -> list[dict[str, Any]]:
    """Retrieve relevant clinical guideline snippets for a clinical query."""
    if not settings.RAG_ENABLED:
        return []

    indexer = get_rag_indexer()
    return indexer.search(query, top_k=top_k)


def format_rag_context(guidelines: list[dict[str, Any]]) -> str:
    """Format retrieved guideline chunks into a prompt-ready context string."""
    if not guidelines:
        return "No specific reference clinical guidelines retrieved."

    formatted_sections = []
    for g in guidelines:
        formatted_sections.append(
            f"--- Reference Guideline: {g['title']} ({g['section']}) ---\n"
            f"Source: {g['source']}\n"
            f"{g['full_content']}\n"
        )
    return "\n".join(formatted_sections)
