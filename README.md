# 🏎️ GRID LOCATOR: F1 Threads Community Map

A lightweight, privacy-focused community building tool for the F1 Threads community.

## 🌟 Features
- **Privacy First**: No exact locations. Users pick a country or region.
- **Zero Login**: Just enter a nickname and join the grid.
- **Security by Obscurity**: Shared via private community links. Only people with the link can see each other.
- **F1 Aesthetic**: Premium dark mode with neon red accents.

## 🚀 How to Host on GitHub Pages
1. **Push to GitHub**: Create a new repository and push this code.
2. **Build and Deploy**:
   - Go to your repository **Settings > Pages**.
   - Under **Build and deployment**, set **Source** to "GitHub Actions".
   - This project is a Vite app. You can use the standard Vite deploy action.

## 🔒 Privacy & Community Links
By default, the app uses a "Community ID" (`cid`) in the URL.
- Link: `https://yourname.github.io/f1-map/?cid=monaco-grand-prix`
- Only users using the `monaco-grand-prix` ID will see each other.
- You can create any ID you want by simply changing the URL!

## 💾 Connecting a Database (Supabase)
To make the map persistent for everyone (not just local), follow these steps:
1. Create a free project at [supabase.com](https://supabase.com).
2. Create a table called `locations` with:
   - `name` (text)
   - `lat` (float)
   - `lng` (float)
   - `type` (text)
   - `community` (text)
3. Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to an `.env` file:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Update `src/main.js` to uncomment the Supabase logic.

## 🛠️ Local Development
```bash
npm install
npm run dev
```
