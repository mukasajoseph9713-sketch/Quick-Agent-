
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// -------- Google Vision (web detection) --------
let visionClient = null;
async function getVisionClient() {
  if (!visionClient) {
    const {ImageAnnotatorClient} = await import('@google-cloud/vision');
    visionClient = new ImageAnnotatorClient(); // Uses GOOGLE_APPLICATION_CREDENTIALS
  }
  return visionClient;
}

/**
 * POST /api/scan
 * form-data: file: <image>
 * Returns: { bestLabels: string[], similar: [{url: string, score?: number}], guess?: string }
 */
app.post('/api/scan', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const client = await getVisionClient();
    const [result] = await client.webDetection({ image: { content: req.file.buffer } });
    const webDetection = result.webDetection || {};

    const bestLabels = (webDetection.bestGuessLabels || []).map(l => l.label);
    const guess = bestLabels[0] || null;
    const similar = (webDetection.visuallySimilarImages || []).slice(0, 8).map(v => ({ url: v.url }));
    const pages = (webDetection.pagesWithMatchingImages || []).slice(0, 8).map(p => ({ url: p.url, pageTitle: p.pageTitle }));

    res.json({ guess, bestLabels, similar, pages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

// -------- OpenAI based caption + translation --------
import OpenAI from 'openai';
let openai = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  return openai;
}

/**
 * POST /api/caption
 * { title?: string, price?: string, phone?: string, username?: string, lang?: 'en'|'lg' }
 */
app.post('/api/caption', async (req, res) => {
  try {
    const { title = 'product', price = '', phone = '', username = '', lang = 'en' } = req.body || {};
    const client = getOpenAI();
    if (!client.apiKey) return res.status(400).json({ error: 'Missing OPENAI_API_KEY' });

    const prompt = `Write a high-converting social caption for Facebook Marketplace for an item called "${title}". Add bullet benefits, a short CTA, hashtags for Uganda, and include this line with phone/username: Phone: ${phone} ${username}. Price: UGX ${price}. Keep it under 120 words.`;
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    let text = resp.choices?.[0]?.message?.content?.trim() || "Great deal available now!";

    if (lang === 'lg') {
      const tPrompt = `Translate this marketing caption into Luganda with natural wording for Kampala audience. Keep emojis/formatting if useful:\n\n${text}`;
      const tResp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: tPrompt }],
        temperature: 0.6,
      });
      text = tResp.choices?.[0]?.message?.content?.trim() || text;
    }

    res.json({ caption: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Caption failed' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// SPA fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('QuickAgent v5.3 online listening on', PORT);
});
