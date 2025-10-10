import express from "express";
import cors from "cors";
import { TITLES } from "./data.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// GET /api/search?q=키워드
// - 1초 지연(Mock)
// - 공백으로 분리된 모든 토큰이 "이름" 또는 "keywords" 중 하나에 포함되면 매칭
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  // 토큰화 (여러 단어 검색 지원: "여름 로맨스")
  const tokens = q.split(/\s+/).map(s => s.toLowerCase()).filter(Boolean);

  // 입력 없으면 빈 결과
  if (tokens.length === 0) {
    return res.json({ items: [], total: 0 });
  }

  // 1초 지연
  await new Promise(r => setTimeout(r, 1000));

  const norm = (s) => (s || "").toLowerCase();

  const items = TITLES.filter(t => {
    const name = norm(t.name);                 // 작품명
    const tags = (t.keywords || []).map(norm); // 태그 배열
    // 모든 토큰이 name 또는 tags 중 하나에 포함되면 true
    return tokens.every(tok =>
      name.includes(tok) || tags.some(tag => tag.includes(tok))
    );
  });

  res.json({ items, total: items.length });
});

app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
