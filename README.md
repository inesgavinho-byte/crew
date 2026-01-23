# 🏄 CREW - Surf Tribe App

Uma aplicação PWA para surfistas organizarem crews, partilharem condições e coordenarem sessões.

## 🚀 Quick Start (Configuração em 5 minutos)

### 1. **Clonar e Instalar**
```bash
git clone https://github.com/SEU_USERNAME/crew-app.git
cd crew-app
npm install
```

### 2. **Configurar Supabase**

1. Cria conta em [supabase.com](https://supabase.com)
2. Cria novo projeto
3. Vai a **SQL Editor** e executa o ficheiro `supabase-schema.sql` (copia e cola tudo)
4. Vai a **Settings** > **API** e copia:
   - Project URL
   - anon/public key

### 3. **Configurar Variáveis de Ambiente**

```bash
cp .env.example .env
```

Edita `.env` com as tuas credenciais:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173
```

### 4. **Executar Localmente**

```bash
npm run dev
```

Abre `http://localhost:5173` 🎉

---

## 📦 Tecnologias

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Styling**: CSS custom (theme surf)
- **Maps**: Leaflet + React Leaflet
- **PWA**: Vite PWA Plugin
- **Forecasts**: Open-Meteo Marine API

---

## 🗂️ Estrutura do Projeto

```
crew-app/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── Icons.jsx
│   │   ├── ChatSidebar.jsx
│   │   ├── CheckInModal.jsx
│   │   └── ...
│   ├── pages/          # Páginas principais
│   │   ├── Auth.jsx
│   │   ├── Feed.jsx
│   │   ├── Crews.jsx
│   │   ├── Map.jsx
│   │   └── ...
│   ├── lib/            # Lógica e integrações
│   │   ├── supabase.js
│   │   ├── AuthContext.jsx
│   │   ├── forecast.js
│   │   ├── tides.js
│   │   └── ...
│   ├── App.jsx         # Router principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Estilos globais
├── public/             # Assets estáticos
├── .env.example        # Template de variáveis de ambiente
├── package.json
├── vite.config.js
└── supabase-schema.sql # Schema da base de dados
```

---

## 🎯 Funcionalidades Principais

### ✅ Já Implementadas
- 🔐 Autenticação (Email + Google OAuth)
- 👥 Sistema de Crews (criar, convidar, juntar)
- 📍 Check-ins com condições de surf
- 💬 Chat em tempo real por crew
- 📊 Gráficos de marés
- 🌊 Previsões de ondas
- 🔔 Alertas de condições
- 📝 Log de sessões
- 🏄 Gestão de pranchas
- 💬 Mensagens privadas
- 🛒 Marketplace (básico)
- 🗺️ Mapa com spots

### 🔜 Por Implementar
- 📸 Upload de fotos para Storage
- 📈 Estatísticas e analytics
- 🏆 Sistema de conquistas
- 🌐 Modo offline completo
- 📱 Notificações push

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de dev

# Build
npm run build        # Cria build de produção

# Preview
npm run preview      # Testa build localmente
```

---

## 🚢 Deploy

### Netlify (Recomendado)

1. **Push para GitHub**
```bash
git add .
git commit -m "Ready for deploy"
git push origin main
```

2. **Conectar no Netlify**
   - Vai a [netlify.com](https://netlify.com)
   - "Add new site" > "Import from Git"
   - Seleciona o repositório
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Adicionar Environment Variables**
   - No dashboard do Netlify: Site settings > Environment variables
   - Adiciona as mesmas variáveis do `.env`

4. **Configurar Supabase**
   - No Supabase: Authentication > URL Configuration
   - Adiciona o URL do Netlify às "Redirect URLs"

### Vercel (Alternativa)

Similar ao Netlify, mas com configuração automática do Vite.

---

## 🧪 Testar Funcionalidades

### Criar Conta e Crew
1. Abre a app
2. Regista-te com email
3. Cria um crew
4. Gera código de convite
5. Abre em janela anónima e junta-te ao crew

### Testar Chat
1. Com 2 utilizadores no mesmo crew
2. Envia mensagem
3. Verifica atualização em tempo real

### Testar Alertas
1. Cria um alerta para um spot
2. Define condições (ex: ondas > 1m)
3. Aguarda verificação (executada ao login)

---

## 🐛 Troubleshooting

### "Invalid API key"
- Verifica se copiaste bem a chave do Supabase
- Confirma que está no `.env` e começa com `eyJ...`

### Tabelas não existem
- Executa o ficheiro `supabase-schema.sql` no SQL Editor
- Verifica se completou sem erros

### Build falha
```bash
# Limpa node_modules e reinstala
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Chat não atualiza em tempo real
- Verifica se Row Level Security está configurado
- Confirma que o Realtime está ativo no Supabase

---

## 📚 Documentação Útil

- [Supabase Docs](https://supabase.com/docs)
- [React Router](https://reactrouter.com)
- [Vite](https://vitejs.dev)
- [Leaflet](https://leafletjs.com)

---

## 🤝 Contribuir

1. Fork o projeto
2. Cria uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit as mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abre um Pull Request

---

## 📄 Licença

MIT License - vê o ficheiro LICENSE para detalhes

---

## 👨‍💻 Autor

Desenvolvido para a comunidade de surf 🏄

**No time / No territory** 🤙

---

## 📞 Suporte

Problemas? Abre uma issue no GitHub ou consulta o ficheiro `SETUP_GUIDE.md` para instruções detalhadas.

---

**Happy surfing!** 🌊
