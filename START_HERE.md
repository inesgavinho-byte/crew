# 🏄 CREW App - COMEÇA AQUI!

## 📦 Tens Tudo Pronto para Deploy!

Esta pasta contém **TUDO** o que precisas para fazer deploy da app CREW.

---

## ⚡ 3 Passos Rápidos:

### 1️⃣ Configurar Supabase (5 min)
Já tens o projeto criado: `https://kdvdogdobijyikoloadw.supabase.co`

**Executar scripts SQL:**
1. Vai ao Supabase → **SQL Editor**
2. Executa estes 4 scripts **pela ordem** (um de cada vez):
   - `supabase/step1-cleanup-safe.sql`
   - `supabase/step2-tables.sql`
   - `supabase/step3-rls.sql`
   - `supabase/step4-functions.sql`

✅ Base de dados pronta!

---

### 2️⃣ Push para GitHub (2 min)
```bash
git init
git add .
git commit -m "Initial commit - CREW app"

# Cria repo no GitHub primeiro: https://github.com/new
# Depois:
git remote add origin https://github.com/TEU_USERNAME/crew-app.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ Deploy no Netlify (3 min)

1. Vai a https://netlify.com
2. **"Add new site"** → **"Import from Git"** → Escolhe GitHub
3. Seleciona o repositório `crew-app`
4. **Build settings** (já está configurado no `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment variables** - Adiciona estas 3:
   ```
   VITE_SUPABASE_URL = https://kdvdogdobijyikoloadw.supabase.co
   
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdmRvZ2RvYmlqeWlrb2xvYWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDQwOTIsImV4cCI6MjA4NDc4MDA5Mn0.kaqnepkFULIBrqb1TXMbawe_LrK4T5mi3iZaqj9T2P4
   
   VITE_APP_URL = (deixa vazio por agora)
   ```
6. Clica **"Deploy site"**
7. Aguarda 2-3 minutos

---

### 4️⃣ Configurar URL Final (2 min)

Depois do deploy:
1. **Netlify** → Site settings → Domain management
2. Edit site name → Escolhe: `crew-app` (ou outro)
3. Teu URL final: `https://crew-app.netlify.app`

Agora:
1. **Netlify** → Site settings → Environment variables
2. Edita `VITE_APP_URL` → Coloca: `https://crew-app.netlify.app`
3. **Deploys** → Trigger deploy → Clear cache and deploy

Finalmente:
1. **Supabase** → Authentication → URL Configuration
2. Site URL: `https://crew-app.netlify.app`
3. Redirect URLs: Adiciona `https://crew-app.netlify.app/**`
4. Save

---

## ✅ PRONTO! App Online!

Testa: `https://crew-app.netlify.app` (ou teu URL)

---

## 📚 Mais Informações:

- **QUICK_START.md** - Passo a passo detalhado
- **DEPLOY_GUIDE.md** - Guia completo com troubleshooting
- **README.md** - Documentação do projeto

---

## 📁 Estrutura da Pasta:

```
crew-app/
├── .env.example          # Template de variáveis
├── .gitignore           # Protege ficheiros sensíveis
├── netlify.toml         # Config automática Netlify
├── package.json         # Dependências
├── vite.config.js       # Config Vite
├── index.html           # HTML base
├── README.md            # Documentação
├── QUICK_START.md       # Guia rápido
├── DEPLOY_GUIDE.md      # Guia completo
├── supabase/            # Scripts SQL
│   ├── step1-cleanup-safe.sql
│   ├── step2-tables.sql
│   ├── step3-rls.sql
│   └── step4-functions.sql
├── public/              # Assets estáticos
└── src/
    ├── main.jsx         # Entry point
    ├── App.jsx          # Router principal
    ├── index.css        # Estilos globais
    ├── components/      # Componentes reutilizáveis
    ├── pages/           # Páginas principais
    └── lib/             # Lógica e integrações
```

---

## 🔄 Workflow Futuro:

```bash
# Edita código...
git add .
git commit -m "Nova feature"
git push
# Netlify faz deploy automático! 🚀
```

---

## 🆘 Precisa de Ajuda?

Consulta os ficheiros de documentação ou abre uma issue no GitHub!

---

**Boa sorte com o deploy! 🏄🌊**
