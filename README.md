
# QuickAgent — ONLINE v5.3

**This version works 100% online.** It includes:

- Image Scan using **Google Cloud Vision (Web Detection)** → returns best-guess labels + visually similar images (top 4) + pages.
- AI Caption generator with **English/Luganda** (via OpenAI).

> NOTE: You need your own API keys to enable the online features:
> - Google Vision: set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON.
> - OpenAI: set `OPENAI_API_KEY`.

## 1) Deploy (Render/Railway/Heroku)

1. Create a new Web Service.
2. Upload this ZIP or connect your Git repo.
3. **Build command**: `npm install`
4. **Start command**: `npm start`
5. **Node version**: 18+

### Environment Variables
- `OPENAI_API_KEY` = your OpenAI key (for captions).
- `GOOGLE_APPLICATION_CREDENTIALS` = path to service account file (Render: use a Secret File).
  - On Render, add a **Secret File** named `gcloud-sa.json` (paste the JSON).
  - Set env var: `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcloud-sa.json`

## 2) Local run (if you have a laptop)
```bash
npm install
# Save your service account JSON to ./gcloud-sa.json
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcloud-sa.json"
export OPENAI_API_KEY="sk-..."
npm start
# open http://localhost:8080
```

## 3) How to use (phone)
- Open your deployed link.
- Go to **Scan Image** → take/upload a product photo → **Scan Now**.
  - You’ll see **Best guess**, **Other guesses**, and **Visually similar images** (top 4) with direct links.
- Go to **Captions** → fill title, price, phone, username → choose **English or Luganda** → **Generate Caption**.

## Why this works for Google
We use **Google Vision Web Detection** which is the same technology behind Google Images.
It analyzes the content and returns **visually similar images** + **pages with matching images**.
This avoids browser restrictions and works from your server.
