import os
import re
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

load_dotenv(override=True)

API_KEY = os.getenv("GROQ_API_KEY", "").strip()
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
KNOWLEDGE_FILE = os.getenv("KNOWLEDGE_FILE", "samples/knowledge.txt")

if not API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to your .env file.")

app = Flask(__name__)
client = Groq(api_key=API_KEY)


# --------------------------------------------------------------------
# KNOWLEDGE BASE — load, chunk, retrieve
# --------------------------------------------------------------------
_chunks = []

STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is",
    "are", "was", "were", "be", "with", "as", "at", "by", "it", "this",
    "that", "we", "you", "i", "do", "does", "can", "how", "what", "why",
    "your", "our", "my", "me", "us", "from", "about", "will", "would",
}


def tokenize(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def load_chunks():
    """Split knowledge.txt on '====' separator lines into sections."""
    global _chunks
    if _chunks:
        return _chunks

    with open(KNOWLEDGE_FILE, encoding="utf-8") as f:
        raw = f.read()

    parts = re.split(r"\n={10,}\n", raw)

    for part in parts:
        part = part.strip()
        if len(part) < 40:
            continue
        if len(part) > 4000:
            for i in range(0, len(part), 3500):
                _chunks.append(part[i:i + 4000])
        else:
            _chunks.append(part)

    return _chunks


def retrieve(question, top_k=4):
    """Score chunks by keyword overlap, return top_k joined as one string."""
    q_tokens = tokenize(question)
    if not q_tokens:
        return ""

    scored = []
    for chunk in load_chunks():
        overlap = len(q_tokens & tokenize(chunk))
        if overlap:
            scored.append((overlap / (1 + len(chunk) / 5000), chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return "\n\n---\n\n".join(c for _, c in scored[:top_k])


SYSTEM_PROMPT = """You are the assistant for a technology services company \
offering AI, Data Science, and Full Stack Web Development services.

CRITICAL RULES:
- Every answer MUST be grounded in the CONTEXT below.
- If the user asks a general how-to question (e.g. "how do I build X?"),
  reframe it as a service question: what WE offer around X — not a tutorial.
- Never produce code tutorials, framework comparisons, or step-by-step
  build guides unless the context explicitly contains them.
- If the context lacks the answer, reply exactly:
  "I don't know based on the provided document."
- Keep answers concise. Use bullet lists for features/services.
- For pricing or timelines, give the ranges from the context and note
  that final figures depend on scope, then suggest a consultation.

CONTEXT:
{context}
"""


# --------------------------------------------------------------------
# ROUTES
# --------------------------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "No message provided"}), 400

    last_user = next(
        (m["content"] for m in reversed(messages) if m.get("role") == "user"),
        ""
    )

    try:
        context = retrieve(last_user, top_k=4) if last_user else ""
        system_prompt = SYSTEM_PROMPT.format(
            context=context or "(no relevant context found)"
        )

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                *messages,
            ],
            temperature=0.2,
        )

        return jsonify({
            "reply": response.choices[0].message.content,
            "sources": [c.split("\n", 1)[0][:100]
                        for c in context.split("\n\n---\n\n")] if context else [],
        })

    except Exception as e:
        app.logger.exception("chat failed")
        return jsonify({"error": str(e)}), 500


@app.route("/api/rag", methods=["POST"])
def rag():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        context = retrieve(question, top_k=4)

        if not context:
            return jsonify({
                "reply": "I don't know based on the provided document.",
                "sources": [],
            })

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system",
                 "content": SYSTEM_PROMPT.format(context=context)},
                {"role": "user", "content": question},
            ],
            temperature=0.2,
        )

        return jsonify({
            "reply": response.choices[0].message.content,
            "sources": [c.split("\n", 1)[0][:100]
                        for c in context.split("\n\n---\n\n")],
        })

    except FileNotFoundError:
        return jsonify({"error": f"Knowledge file not found: {KNOWLEDGE_FILE}"}), 404
    except Exception as e:
        app.logger.exception("rag failed")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
    
    
    
    
    # import os
# from flask import Flask, render_template, request, jsonify
# from dotenv import load_dotenv
# from groq import Groq

# load_dotenv()

# API_KEY = os.getenv("GROQ_API_KEY")
# MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
# KNOWLEDGE_FILE = os.getenv("KNOWLEDGE_FILE", "samples/knowledge.txt")

# app = Flask(__name__)
# client = Groq(api_key=API_KEY)


# @app.route("/")
# def home():
#     return render_template("index.html")


# @app.route("/api/chat", methods=["POST"])
# def chat():
#     data = request.get_json()
#     messages = data.get("messages", [])

#     if not messages:
#         return jsonify({"error": "No message provided"}), 400

#     try:
#         response = client.chat.completions.create(
#             model=MODEL,
#             messages=[
#                 {
#                     "role": "system",
#                     "content": "You are a helpful assistant."
#                 },
#                 *messages
#             ]
#         )

#         reply = response.choices[0].message.content

#         return jsonify({
#             "reply": reply
#         })

#     except Exception as e:
#         return jsonify({
#             "error": str(e)
#         }), 500


# @app.route("/api/rag", methods=["POST"])
# def rag():
#     data = request.get_json()
#     question = data.get("question", "").strip()

#     if not question:
#         return jsonify({"error": "Question is required"}), 400

#     try:
#         with open(KNOWLEDGE_FILE, encoding="utf-8") as file:
#             document = file.read()

#         response = client.chat.completions.create(
#             model=MODEL,
#             messages=[
#                 {
#                     "role": "system",
#                     "content": (
#                         "Answer the user's question using only the provided document. "
#                         "If the answer is not contained in the document, say: "
#                         "'I don't know based on the provided document.'\n\n"
#                         f"DOCUMENT:\n{document}"
#                     )
#                 },
#                 {
#                     "role": "user",
#                     "content": question
#                 }
#             ]
#         )

#         reply = response.choices[0].message.content

#         return jsonify({
#             "reply": reply
#         })

#     except FileNotFoundError:
#         return jsonify({
#             "error": f"Knowledge file not found: {KNOWLEDGE_FILE}"
#         }), 404

#     except Exception as e:
#         return jsonify({
#             "error": str(e)
#         }), 500


# if __name__ == "__main__":
#     app.run(debug=True)