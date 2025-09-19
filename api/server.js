// api/server.js
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

const BUILD_ID = 'dramabox_prod_20250918';   // change if they roll a new build
const BASE     = 'https://www.dramabox.com';

// -------- latest dramas (home page) --------
app.get('/api/latest', async (req, res) => {
  try {
    // scrape the home-page JSON
    const { data } = await axios.get(
      `${BASE}/_next/data/${BUILD_ID}/en.json`,
      { headers: { 'x-nextjs-data': '1' } }
    );
    // dramas are inside pageProps.initialDramas || pageProps.dramaList
    const list = data.pageProps.initialDramas || data.pageProps.dramaList || [];
    res.json({ data: { list } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------- search --------
app.get('/api/search', async (req, res) => {
  try {
    const kw  = (req.query.keyword || '').trim();
    if (!kw) return res.json({ data: { list: [] } });

    // they use a q= parameter on /search
    const { data } = await axios.get(
      `${BASE}/_next/data/${BUILD_ID}/en/search.json?q=${encodeURIComponent(kw)}`,
      { headers: { 'x-nextjs-data': '1' } }
    );
    const list = data.pageProps.dramaList || [];
    res.json({ data: { list } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------- episode stream --------
app.get('/api/stream', async (req, res) => {
  try {
    const { bookId, index = 1 } = req.query;
    if (!bookId) throw new Error('bookId required');

    // 1.  get drama detail to grab chapterId of episode N
    const detailRes = await axios.get(
      `${BASE}/_next/data/${BUILD_ID}/en/drama/${bookId}/dummy.json?bookId=${bookId}&bookNameEn=dummy`,
      { headers: { 'x-nextjs-data': '1' } }
    );
    const chapters = detailRes.data.pageProps.drama?.chapterList || [];
    const chapter  = chapters[index - 1];   // index is 1-based
    if (!chapter) throw new Error('Episode not found');

    // 2.  get the actual video JSON
    const streamRes = await axios.get(
      `${BASE}/_next/data/${BUILD_ID}/en/video/${bookId}_${chapter.id}/dummy.json?bookId=${bookId}&chapterId=${chapter.id}&chapterNameEn=dummy`,
      { headers: { 'x-nextjs-data': '1' } }
    );
    const url = streamRes.data.pageProps.videoInfo?.url || streamRes.data.pageProps.url;
    res.json({ data: { url } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`> drambox-web running on :${PORT}`));