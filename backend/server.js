app.post('/api/query', async (req, res) => {
  const { query, topK, temperature, topP, modelTopK } = req.body; 
  // 'topK' here refers to how many document chunks to retrieve
  // 'modelTopK' is used for generationConfig.topK

  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const qEmb = await geminiEmbedding(query);
    const store = loadVectorStore();
    const scored = store.map(item => ({ ...item, score: dot(qEmb, item.embedding) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK || 3);
    const context = top.map(t => t.text).join('\n\n');

    const prompt = `Answer using CONTEXT. If not found, say "not found in documents".\n\nCONTEXT:\n${context}\n\nQUESTION:\n${query}`;

    const answer = await geminiChat(
      prompt,
      500,
      temperature ?? 0.7,
      topP ?? 0.9,
      modelTopK ?? 40
    );

    res.json({ answer, results: top });
  } catch (err) {
    res.status(500).json({ error: 'query failed', details: err.message });
  }
});
