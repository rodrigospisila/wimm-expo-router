# 🚀 Setup do Projeto Wimm

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **PostgreSQL** (para o backend)
- **Git**

## 🔧 Configuração do Backend

### 1. Clone o repositório do backend
```bash
git clone https://github.com/rodrigospisila/wimm-nestjs-backend.git
cd wimm-nestjs-backend
```

### 2. Instale as dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configure o banco de dados
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar o serviço
sudo service postgresql start

# Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER wimm_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE wimm OWNER wimm_user;"
sudo -u postgres psql -c "ALTER USER wimm_user CREATEDB;"
```

### 4. Configure as variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
nano .env
```

**Exemplo de .env para o backend:**
```env
DATABASE_URL="postgresql://wimm_user:your_password@localhost:5432/wimm?schema=public"
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 5. Execute as migrações do banco
```bash
npx prisma migrate dev --name init
```

### 6. Inicie o servidor backend
```bash
pnpm run start:dev
# ou
npm run start:dev
```

O backend estará rodando em: `http://localhost:3000`

## 📱 Configuração do Frontend

### 1. Clone o repositório do frontend
```bash
git clone https://github.com/rodrigospisila/wimm-expo-router.git
cd wimm-expo-router
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar se necessário (geralmente não precisa alterar)
nano .env
```

**Exemplo de .env para o frontend:**
```env
API_BASE_URL=http://localhost:3000
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Inicie o aplicativo

#### Para Web:
```bash
npm run web
```

#### Para Mobile (Android):
```bash
npm run android
```

#### Para Mobile (iOS):
```bash
npm run ios
```

#### Para usar com Expo Go:
```bash
npm start
# Escaneie o QR Code com o app Expo Go
```

## 🔗 URLs de Acesso

- **Frontend Web**: http://localhost:8081
- **Backend API**: http://localhost:3000
- **Documentação da API**: http://localhost:3000/api (se configurado)

## 🧪 Testando a Integração

1. **Inicie o backend** primeiro
2. **Inicie o frontend** 
3. **Acesse a aplicação** via web ou mobile
4. **Crie uma conta** na tela de registro
5. **Faça login** e explore o dashboard

## 🐛 Solução de Problemas

### Backend não conecta ao banco
- Verifique se o PostgreSQL está rodando: `sudo service postgresql status`
- Confirme as credenciais no arquivo `.env`
- Execute: `npx prisma db push` para sincronizar o schema

### Frontend não conecta ao backend
- Verifique se o backend está rodando na porta 3000
- Confirme a URL da API no arquivo `.env` do frontend
- Para mobile, use o IP da máquina ao invés de `localhost`

### Erro de CORS
- Adicione a origem do frontend nas configurações de CORS do backend
- Verifique se as portas estão corretas

## 📚 Comandos Úteis

### Backend
```bash
# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio

# Gerar cliente Prisma
npx prisma generate
```

### Frontend
```bash
# Limpar cache do Expo
npx expo start --clear

# Instalar dependências nativas
npx expo install

# Build para produção
npx expo build
```

## 🔐 Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite arquivos `.env` com dados sensíveis
- Use senhas fortes para o banco de dados
- Gere um JWT_SECRET seguro para produção
- Configure HTTPS em produção
