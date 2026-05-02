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
2. Go to the **SQL Editor** and run the following command to create the table and security policies:

```sql
CREATE TABLE drivers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timestamp BIGINT NOT NULL,
  community_id TEXT NOT NULL DEFAULT 'global'
);

-- Enable Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to join and see the grid
CREATE POLICY "Public Access" ON drivers FOR ALL TO anon USING (true) WITH CHECK (true);

-- Ensure users can update their own location by nickname
CREATE UNIQUE INDEX drivers_name_community_idx ON drivers (name, community_id);
```

3. Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your GitHub Repository Secrets (for deployment) or a local `.env` file for testing:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

## 🛠️ Local Development
```bash
npm install
npm run dev
```
