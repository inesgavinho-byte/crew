# 🚀 CREW App - Deploy com GitHub + Netlify

## 📋 O Que Vais Fazer:

1. **Preparar o projeto** (eu já fiz isto!)
2. **Fazer commit ao GitHub**
3. **Conectar Netlify ao GitHub**
4. **Deploy automático!** 🎉

---

## ✅ PASSO 1: Estrutura do Projeto (JÁ ESTÁ PRONTA!)

Já preparei tudo o que precisas:
- ✅ `.env.example` - Template de variáveis
- ✅ `.gitignore` - Protege ficheiros sensíveis
- ✅ `README.md` - Documentação
- ✅ Todos os ficheiros do projeto

**Não committes o `.env` com as tuas credenciais!** (o `.gitignore` já está a proteger)

---

## 📦 PASSO 2: Fazer Commit ao GitHub

### 2.1 - Inicializar Git (se ainda não fizeste)

Na pasta do projeto, executa:

```bash
git init
git add .
git commit -m "Initial commit - CREW surf app"
```

### 2.2 - Criar Repositório no GitHub

1. Vai a https://github.com
2. Faz login
3. Clica no **"+"** no canto superior direito
4. Escolhe **"New repository"**
5. Configurações:
   - **Nome**: `crew-app` (ou outro nome)
   - **Descrição**: "Surf tribe coordination app"
   - **Público ou Privado**: À tua escolha
   - **NÃO marques** "Initialize with README" (já tens um!)
6. Clica **"Create repository"**

### 2.3 - Push para GitHub

O GitHub vai mostrar-te uns comandos. Executa estes:

```bash
git remote add origin https://github.com/TEU_USERNAME/crew-app.git
git branch -M main
git push -u origin main
```

**Substitui `TEU_USERNAME`** pelo teu username do GitHub!

---

## 🌐 PASSO 3: Deploy no Netlify

### 3.1 - Conectar ao Netlify

1. Vai a https://netlify.com
2. Faz login (pode ser com a conta GitHub - mais fácil!)
3. Clica **"Add new site"** → **"Import an existing project"**
4. Escolhe **"Deploy with GitHub"**
5. Se pedido, autoriza o Netlify a aceder ao GitHub
6. Seleciona o repositório **`crew-app`** (ou o nome que escolheste)

### 3.2 - Configurar Build Settings

Na página de configuração:

**Build settings:**
- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

**Environment variables** (MUITO IMPORTANTE!):

Clica em **"Add environment variables"** e adiciona estas 3:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://kdvdogdobijyikoloadw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdmRvZ2RvYmlqeWlrb2xvYWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMDQwOTIsImV4cCI6MjA4NDc4MDA5Mn0.kaqnepkFULIBrqb1TXMbawe_LrK4T5mi3iZaqj9T2P4` |
| `VITE_APP_URL` | (deixa vazio por agora, vamos preencher depois) |

### 3.3 - Deploy!

1. Clica **"Deploy site"**
2. Aguarda 2-3 minutos
3. O Netlify vai fazer:
   - ✅ Clone do repositório
   - ✅ `npm install`
   - ✅ `npm run build`
   - ✅ Deploy do site

### 3.4 - Configurar URL Personalizado (Opcional)

Depois do deploy terminar:

1. Vai a **"Site settings"** → **"Domain management"**
2. Clica **"Options"** → **"Edit site name"**
3. Escolhe um nome: `crew-app` ou `meu-crew` (tem que estar disponível)
4. O teu site ficará em: `https://crew-app.netlify.app`

### 3.5 - Atualizar Environment Variable

Agora que sabes o URL final:

1. No Netlify, vai a **"Site settings"** → **"Environment variables"**
2. Edita `VITE_APP_URL`
3. Coloca o teu URL: `https://crew-app.netlify.app` (ou o que escolheste)
4. Clica **"Save"**
5. Vai a **"Deploys"** → **"Trigger deploy"** → **"Clear cache and deploy site"**

---

## 🔧 PASSO 4: Configurar Supabase para Produção

**IMPORTANTE:** Tens que dizer ao Supabase que pode aceitar requests do Netlify!

1. Vai ao Supabase: https://kdvdogdobijyikoloadw.supabase.co
2. Vai a **Authentication** → **URL Configuration**
3. Em **"Site URL"**, muda para: `https://crew-app.netlify.app` (o teu URL)
4. Em **"Redirect URLs"**, adiciona:
   - `https://crew-app.netlify.app/**`
   - `http://localhost:5173/**` (para desenvolvimento local)
5. Clica **"Save"**

---

## ✅ PASSO 5: Testar!

1. Abre o teu site: `https://crew-app.netlify.app`
2. Deves ver a página de login! 🎉
3. Cria uma conta
4. Testa criar um crew
5. Testa enviar signals

---

## 🔄 Próximos Deploys (Com Claude Code)

Depois da configuração inicial, qualquer commit novo vai fazer deploy automático:

```bash
# Faz mudanças no código...
git add .
git commit -m "Adiciona nova funcionalidade"
git push

# Netlify deteta o push e faz deploy automático! 🚀
```

---

## 🎯 Resumo do Workflow:

```
1. Editas código localmente
2. git commit + git push
3. Netlify deteta push
4. Build automático
5. Deploy automático
6. App atualizada! ✅
```

---

## 🐛 Troubleshooting

### Deploy falhou no Netlify
- Vai a **"Deploys"** → Clica no deploy falhado
- Lê o log de erro
- Geralmente é:
  - Environment variables em falta
  - Erro no código (testa `npm run build` localmente)

### App carrega mas não funciona
- Verifica environment variables no Netlify
- Verifica se adicionaste o URL nas Redirect URLs do Supabase

### Erro "Invalid API key"
- Verifica environment variables no Netlify
- Certifica-te que copiaste bem a anon key

---

## 📞 Precisa de Ajuda?

Se algum passo falhar, diz-me qual e eu ajudo! 🚀

---

**Preparado para fazer commit?** 
Execute os comandos do PASSO 2 e diz-me quando chegares ao Netlify!
