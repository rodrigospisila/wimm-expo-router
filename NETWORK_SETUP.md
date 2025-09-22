# 🌐 Configuração de Rede para Expo Go

## ❌ Problema Identificado

O aplicativo está tentando se conectar ao `localhost:3000`, mas o Expo Go no celular não consegue acessar o localhost do seu computador.

## ✅ Solução

### 1. Descobrir o IP da sua máquina

**Windows:**
```cmd
ipconfig
```
Procure por "Adaptador de Rede sem Fio" e anote o "Endereço IPv4"

**macOS/Linux:**
```bash
ifconfig | grep inet
```
Procure pelo IP que começa com 192.168.x.x ou 10.x.x.x

### 2. Atualizar o arquivo .env

Substitua `192.168.1.100` pelo IP da sua máquina:

```env
# API Configuration
API_BASE_URL=http://SEU_IP_AQUI:3000

# Expo Configuration
EXPO_PUBLIC_API_URL=http://SEU_IP_AQUI:3000
```

**Exemplo:**
```env
API_BASE_URL=http://192.168.1.105:3000
EXPO_PUBLIC_API_URL=http://192.168.1.105:3000
```

### 3. Configurar o Backend

Certifique-se de que o backend NestJS está rodando e aceitando conexões externas:

```bash
cd wimm-nestjs-backend
npm run start:dev
```

O servidor deve mostrar: `Application is running on: http://localhost:3000`

### 4. Testar a Conexão

Teste se consegue acessar a API do seu celular:
- Abra o navegador do celular
- Acesse: `http://SEU_IP:3000/auth/login`
- Deve retornar erro 405 (Method Not Allowed) - isso é normal, significa que a API está acessível

### 5. Limpar Cache e Reiniciar

```bash
# Limpar cache completo
node clear-cache-complete.js

# Ou manualmente:
npx expo start --clear
```

## 🔧 Troubleshooting

### Firewall
Se ainda não funcionar, pode ser o firewall:

**Windows:**
- Vá em "Windows Defender Firewall"
- Clique em "Permitir um aplicativo"
- Adicione Node.js às exceções

**macOS:**
- Vá em "Preferências do Sistema" > "Segurança e Privacidade" > "Firewall"
- Adicione Node.js às exceções

### Rede Corporativa
Se estiver em rede corporativa, pode haver bloqueios. Tente:
- Usar hotspot do celular
- Conectar ambos (PC e celular) na mesma rede Wi-Fi doméstica

## ✅ Verificação Final

1. ✅ IP correto no .env
2. ✅ Backend rodando
3. ✅ Firewall configurado
4. ✅ Mesma rede Wi-Fi
5. ✅ Cache limpo
6. ✅ Expo Go atualizado
