import re
from pathlib import Path
from typing import Any


class DocumentChunk:
    def __init__(self, doc_id: str, title: str, section: str, content: str, source: str):
        self.doc_id = doc_id
        self.title = title
        self.section = section
        self.content = content
        self.source = source
        self.tokens = self._tokenize(f"{title} {section} {content}")

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [word for word in cleaned.split() if len(word) > 2]


class RAGIndexer:
    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.chunks: list[DocumentChunk] = []
        self.build_index()

    def build_index(self):
        self.chunks.clear()
        if not self.docs_dir.exists():
            return

        for file_path in self.docs_dir.glob("*.md"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()

                doc_title = file_path.stem.replace("_", " ").title()
                sections = re.split(r"\n(?=##?\s)", text)

                for idx, sec in enumerate(sections):
                    sec = sec.strip()
                    if not sec:
                        continue

                    lines = sec.split("\n")
                    header = lines[0].replace("#", "").strip() if lines else doc_title
                    body = "\n".join(lines[1:]).strip() if len(lines) > 1 else lines[0]

                    chunk = DocumentChunk(
                        doc_id=f"{file_path.stem}_{idx}",
                        title=doc_title,
                        section=header,
                        content=body,
                        source=f"Clinical Reference: {doc_title} ({header})",
                    )
                    self.chunks.append(chunk)
            except Exception as e:
                print(f"Error indexing {file_path}: {e}")

    def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        query_tokens = DocumentChunk._tokenize(query)
        if not query_tokens or not self.chunks:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            score = 0.0
            chunk_token_set = set(chunk.tokens)

            # Simple BM25-like term frequency & keyword overlap
            for q_tok in query_tokens:
                if q_tok in chunk_token_set:
                    # Header matches carry higher weight
                    header_bonus = 2.5 if q_tok in chunk.section.lower() else 1.0
                    score += chunk.tokens.count(q_tok) * header_bonus

            if score > 0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, chunk in scored_chunks[:top_k]:
            results.append(
                {
                    "doc_id": chunk.doc_id,
                    "title": chunk.title,
                    "section": chunk.section,
                    "content": chunk.content[:400] + ("..." if len(chunk.content) > 400 else ""),
                    "full_content": chunk.content,
                    "source": chunk.source,
                    "relevance_score": round(score, 2),
                }
            )
        return results
