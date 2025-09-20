# Wimm - Where is my money? 💰

**Aplicativo de gerenciamento financeiro mobile desenvolvido com React Native + Expo Router**

## 🚀 Tecnologias

### Frontend (Mobile)
- **React Native** - Framework para desenvolvimento mobile
- **Expo Router** - File-based routing para navegação
- **TypeScript** - Tipagem estática
- **React Native Paper** - Biblioteca de componentes UI
- **Expo** - Plataforma de desenvolvimento
- **AsyncStorage** - Armazenamento local

### Backend (API)
- **NestJS** - Framework Node.js
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas

## 📱 Funcionalidades

### ✅ Implementadas
- **Autenticação completa** (Login/Registro)
- **Dashboard financeiro** com resumo
- **Navegação por tabs** (Dashboard, Carteiras, Transações, Perfil)
- **Interface responsiva** para web e mobile
- **Integração com backend** via API REST
- **Gerenciamento de estado** com Context API
- **Temas claro/escuro** automáticos

### 🔄 Em desenvolvimento
- Gerenciamento completo de carteiras
- Sistema de transações
- Categorização automática
- Relatórios e gráficos
- Notificações push
- Biometria
- Sincronização offline

## 🏗️ Arquitetura

### Estrutura do Projeto (Expo Router)
```
app/
├── (auth)/                 # Grupo de autenticação
│   ├── _layout.tsx        # Layout das telas de auth
│   ├── login.tsx          # Tela de login
│   └── register.tsx       # Tela de registro
├── (tabs)/                # Grupo de navegação principal
│   ├── _layout.tsx        # Layout das tabs
│   ├── index.tsx          # Dashboard (tab inicial)
│   ├── wallets.tsx        # Gerenciamento de carteiras
│   ├── transactions.tsx   # Histórico de transações
│   └── profile.tsx        # Perfil do usuário
├── _layout.tsx            # Layout raiz da aplicação
└── index.tsx              # Roteamento inicial

src/
├── contexts/              # Contextos React
│   └── AuthContext.tsx    # Gerenciamento de autenticação
├── services/              # Serviços de API
│   └── api.ts             # Cliente HTTP e serviços
└── types/                 # Definições TypeScript
    └── index.ts           # Interfaces e tipos
```

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI
- PostgreSQL (para o backend)

### Frontend (React Native + Expo)

```bash
# Clonar o repositório
git clone https://github.com/rodrigospisila/wimm-expo-router.git
cd wimm-expo-router

# Instalar dependências
npm install

# Executar no web
npm run web

# Executar no Android (requer Android Studio)
npm run android

# Executar no iOS (requer macOS e Xcode)
npm run ios
```

### Backend (NestJS)

```bash
# Clonar o repositório do backend
git clone https://github.com/rodrigospisila/wimm-nestjs-backend.git
cd wimm-nestjs-backend

# Instalar dependências
pnpm install

# Configurar banco de dados
# Editar .env com suas credenciais do PostgreSQL

# Executar migrações
npx prisma migrate dev

# Iniciar servidor
pnpm run start:dev
```

## 📱 Como usar

1. **Instale o Expo Go** no seu dispositivo móvel
2. **Execute o projeto** com `npm run start`
3. **Escaneie o QR Code** com o Expo Go
4. **Crie uma conta** ou faça login
5. **Explore as funcionalidades** disponíveis

## 🎨 Design System

### Cores Principais
- **Primary**: `#2e7d32` (Verde escuro)
- **Secondary**: `#4caf50` (Verde claro)
- **Background**: `#f5f5f5` (Cinza claro)
- **Surface**: `#ffffff` (Branco)

### Componentes
- **React Native Paper** para consistência visual
- **Material Design 3** como base
- **Ícones**: Material Icons via @expo/vector-icons

## 🔗 Repositórios Relacionados

- **Frontend**: [wimm-expo-router](https://github.com/rodrigospisila/wimm-expo-router)
- **Backend**: [wimm-nestjs-backend](https://github.com/rodrigospisila/wimm-nestjs-backend)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

**Desenvolvido com ❤️ usando React Native + Expo Router**
