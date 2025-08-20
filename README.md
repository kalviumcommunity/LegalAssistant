# AI-Powered Legal Assistant

**Project Idea:**
Build an intelligent legal assistant that helps lawyers, law students, and clients quickly find legal information, draft structured documents, and get clear explanations of legal terms.

**How it uses the required topics:**

* **System Prompt and User Prompt:**

  * *System prompt*: “You are a professional legal assistant who provides precise, structured, and law-abiding responses.”
  * *User prompt*: Lawyers or clients can ask: “Summarize this contract,” “Explain the difference between lease and license,” or “Find case laws related to intellectual property.”

* **Tuning Parameters:**

  * Adjust *temperature*: Low (0.2–0.4) for factual, consistent legal advice; higher for brainstorming (e.g., contract clause variations).
  * Control *max tokens* to keep summaries concise or allow detailed outputs.

* **Structured Output:**

  * JSON or tabular format for contract summaries (e.g., `{party_names, obligations, penalties, termination_clause}`).
  * Case law search results structured as `{case_name, year, court, relevance_score}`.

* **Function Calling:**

  * Functions like `search_case_law(query)`, `summarize_contract(uploaded_file)`.
  * Example: When a user uploads a contract, the assistant calls a function to extract clauses and outputs a summary.

* **RAG (Retrieval-Augmented Generation):**

  * Connects to a legal database or document repository to provide *accurate, up-to-date* references.
  * Example: If a user asks, “What are the latest Supreme Court rulings on data privacy?”, the assistant retrieves and summarizes them.

**Outcome:**
The legal assistant saves time for lawyers by drafting documents, summarizing lengthy contracts, and providing quick access to case laws, while also helping non-lawyers understand legal language.

---
