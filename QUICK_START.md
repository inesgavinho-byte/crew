# ⚡ Quick Start - Git + Deploy

## 🎯 3 Passos Simples:

### 1️⃣ Git Commit (1 minuto)

```bash
git init
git add .
git commit -m "Initial commit - CREW app"
```

### 2️⃣ GitHub Push (2 minutos)

1. Cria repo no GitHub: https://github.com/new
   - Nome: `crew-app`
   - **NÃO** marques "Initialize with README"
   
2. Faz push:
```bash
git remote add origin https://github.com/TEU_USERNAME/crew-app.git
git branch -M main
git push -u origin main
```

### 3️⃣ Netlify Deploy (3 minutos)

1. Vai a https://netlify.com
2. **"Add new site"** → **"Import from Git"**
3. Escolhe GitHub → Seleciona `crew-app`
4. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment variables** (adiciona 3):
   ```
   VITE_SUPABASE_URL = https://kdvdogdobijyikoloadw.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdmRvZ2RvYmlqeWlrb2xvYWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDQwOTIsImV4cCI6MjA4NDc4MDA5Mn0.kaqnepkFULIBrqb1TXMbawe_LrK4T5mi3iZaqj9T2P4
   VITE_APP_URL = (deixa vazio)
   ```
6. Clica **"Deploy site"**
7. Aguarda 2-3 minutos ☕

### 4️⃣ Configurar URL Final (1 minuto)

Depois do deploy:
1. Netlify → **Site settings** → **Domain management**
2. **Edit site name** → Escolhe: `crew-app`
3. Netlify → **Site settings** → **Environment variables**
4. Edita `VITE_APP_URL` → `https://crew-app.netlify.app`
5. **Deploys** → **Trigger deploy** → **Clear cache**

### 5️⃣ Configurar Supabase (1 minuto)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: `https://crew-app.netlify.app`
3. **Redirect URLs**: Adiciona `https://crew-app.netlify.app/**`
4. **Save**

---

## ✅ PRONTO!

Testa: https://crew-app.netlify.app

---

## 🔄 Próximos Updates:

```bash
# Edita código...
git add .
git commit -m "Nova funcionalidade"
git push
# Deploy automático! 🚀
```

---

**Total: ~8 minutos do zero ao deploy!** ⚡
