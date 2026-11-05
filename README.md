# PORTUS Portal

Frontend da plataforma **PORTUS**, que acompanha cargas enviadas para **Cabo Verde** a partir de qualquer país
(Portugal, França, Estados Unidos, Países Baixos, China…): caixas, carros, mudanças, material de construção.

- **Portal público:** o cliente escolhe a agência no país de onde envia e faz o pedido **sem conta**; acompanha
  com código + telefone, ou cria conta se quiser ver todos os envios.
- **Área das agências:** fila de pedidos de clientes para aceitar, agendar recolha, receber ou recusar.
  Registo de **encomendas** e volumes, validação por tipo de carga, alerta de duplicados e **etiquetas QR
  assinadas** para imprimir.
- **Transitário:** **contentores** (ISO 6346) e **BL Master**, consolidação por leitura de QR com bloqueio de
  capacidade, selo, **viagens**, **manifestos** versionados em .xlsx/.pdf/.csv e alerta das 72 h antes do ETA.
- **Cabo Verde:** **chegadas** e conferência por QR com localização e ocorrências com fotografia; **Alfândega**
  (validar manifesto, canal, reter, libertar); **portaria** (taxas, pagamento, isenção, terceiros autorizados,
  entrega com Gate Pass); **tarifas** para o administrador.
- **Plataforma de gestão** (exportação, administração) e **recolha no terreno** com OCR.

A API está no repositório [`portus_service`](../portus_service). O plano de melhorias está em
[docs/PLANO-DE-MELHORIAS.md](docs/PLANO-DE-MELHORIAS.md) e o estado do backend em
[../portus_service/docs/ROADMAP.md](../portus_service/docs/ROADMAP.md). Para usar e testar a plataforma
passo a passo, perfil a perfil, veja o [manual de utilização e testes](docs/GUIA-DE-UTILIZACAO.md).

---

## Como funciona

```
 Browser ── Next.js 16 (React 19, :3000) ──fetch──▶ portus_service (/api, :4000) ──▶ PostgreSQL
              │
              ├─ src/lib/api-client.ts   pedidos à API, token em memória, renovação automática da sessão
              ├─ src/services/api/*      auth, agências, pedidos, encomendas, importação, contentores, viagens
              ├─ src/domain/*            regras partilhadas (validação, tipos de carga, estados, países)
              └─ src/store/auth-store    perfil do utilizador (o token nunca vai para o localStorage)
```

### Sessão

1. `POST /api/auth/login` devolve um **access token** (15 min), guardado só em memória, e define um
   **cookie `httpOnly`** de refresh que o JavaScript não consegue ler.
2. Cada pedido envia `Authorization: Bearer <token>` e o cookie (`credentials: "include"`).
3. Se o token expirar (ou a página for recarregada), o cliente chama `POST /api/auth/refresh` uma vez e repete o
   pedido. Se a renovação falhar, a sessão é limpa e o utilizador volta ao login.
4. "Sair" revoga a sessão no servidor.

As permissões são aplicadas **no servidor** (perfil e agência). O menu e os redirecionamentos do frontend são
apenas conveniência.

### O que já usa a API e o que ainda é simulado

| Área | Fonte de dados |
| --- | --- |
| Login, logout, sessão, conta de cliente | **API** |
| `/enviar`, `/acompanhar`, `/cliente` (pedidos de envio) | **API** |
| `/agencia/pedidos` (fila e ações da agência) | **API** |
| `/agencia/encomendas` (encomendas, volumes, validação, etiquetas) | **API** |
| `/agencia/importar` (importar listas .xlsx/.csv) | **API** |
| `/agencia/contentores`, `/agencia/viagens` (consolidação, viagens, manifestos) | **API** |
| `/cv/chegadas`, `/alfandega`, `/portaria`, `/admin/tarifas` | **API** |
| Lista de agências no assistente | **API** |
| `/agent/collections` (recolha no terreno, OCR) | IndexedDB do navegador (passa para a API na fase B7) |
| `/exporter/*`, `/dashboard`, `/admin/users`, outras páginas `/cv/*` | Dados de exemplo (`src/mocks`), já fora do menu dos perfis com páginas reais |
| `/register` (pedido de acesso de empresas) | Simulado; as contas de equipa vão ser criadas pelo admin na API |

---

## Requisitos

- **Node.js 24.22.1**
- O backend **`portus_service` a correr** (ver o README dele): PostgreSQL no Docker, migrações e seed

## Instalação e arranque

```bash
# 1. Backend (noutro terminal)
cd ../portus_service
docker compose up -d && npm install && npm run db:migrate && npm run db:seed && npm run dev

# 2. Frontend
cd ../portus
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                     # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Omissão | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Endereço da API. É incluído no código do navegador **no momento do build**: depois de o mudar, reinicie `npm run dev` ou volte a fazer `npm run build` |

O backend tem de autorizar a origem do frontend em `CORS_ORIGIN` (por omissão `http://localhost:3000`).

### Contas de demonstração

Criadas pelo `npm run db:seed` do backend. Palavra-passe: a de `SEED_DEMO_PASSWORD` no `.env` do backend
(nos testes e na demonstração usamos `PortusDemo!2026-CV`; para a repor:
`npm run db:seed -- --reset-passwords`).

| Email | Perfil | Entra em |
| --- | --- | --- |
| `agente@portus.cv` | agente de recolha (Morabeza Envios, Lisboa) | `/agent/collections`, `/agencia/pedidos` |
| `transitario@portus.cv` | transitário (Morabeza Envios, Lisboa) | `/agencia/viagens`, `/agencia/contentores` |
| `terminal@portus.cv` | operador do terminal (Praia) | `/cv/chegadas` |
| `alfandega@portus.cv` | Alfândega (Praia) | `/alfandega` |
| `portaria@portus.cv` | portaria (Praia) | `/portaria` |
| `joao@portus.cv` | administrador (vê todas as agências) | `/admin/users`, `/agencia/pedidos` |
| `ana@portus.cv` | exportador | `/exporter/dashboard` |
| `carla@portus.cv` | agente marítimo | `/cv/navios` |

Clientes não precisam de conta. Se a criarem no fim do pedido, entram em `/cliente`.

---

## Páginas

| Rota | Quem | Descrição |
| --- | --- | --- |
| `/` | público | Página inicial |
| `/enviar` | público | Assistente de pedido: o que envia → país de onde envia, ilha e agência → contactos → confirmar (conta opcional) |
| `/acompanhar` | público | Consulta com código + telefone do remetente |
| `/login` | público | Entrada |
| `/cliente` | cliente | Os meus pedidos |
| `/agencia/pedidos` | agente, admin | Fila de pedidos da agência e ações |
| `/agencia/encomendas` | agente, admin | Encomendas: lista, pesquisa (código, guia, VIN, nome, telefone) |
| `/agencia/encomendas/nova` | agente, admin | Registar encomenda no balcão com volumes |
| `/agencia/encomendas/[id]` | agente, admin | Detalhe, volumes, validar, cancelar |
| `/agencia/encomendas/[id]/editar` | agente, admin | Editar dados de um rascunho |
| `/agencia/encomendas/[id]/etiquetas` | agente, admin | Etiquetas QR para imprimir (uma por volume) |
| `/agencia/importar` | agente, transitário, admin | Importar lista .xlsx/.csv: escolher colunas, pré-visualizar erros e duplicados, importar (há um modelo CSV para descarregar) |
| `/agencia/contentores` | transitário, admin | Contentores: lista, pesquisa (nº, BL, selo), registo com validação ISO 6346 |
| `/agencia/contentores/[id]` | transitário, admin | Ler QR (leitor tipo teclado ou código), BL Master, capacidade, retirar volumes, selar, reabrir, lista de carga |
| `/agencia/viagens` | transitário, admin | Viagens com o prazo do manifesto e o filtro "Com alerta" (72 h) |
| `/agencia/viagens/[id]` | transitário, admin | Contentores da viagem, versões do manifesto, descarregar, registar envio, partida |
| `/cv/chegadas` · `/cv/chegadas/[id]` | terminal, admin | Navios a caminho e chegados ao porto; registar a chegada; progresso por contentor |
| `/cv/chegadas/contentores/[id]` | terminal, admin | Conferir por QR com localização, ocorrências com fotografia (câmara do telemóvel), fechar (BR 23) |
| `/alfandega` · `/alfandega/viagens/[id]` | Alfândega, admin | Validar/rejeitar manifestos; por encomenda: sugestão de canal, canal, reter, libertar com direitos |
| `/portaria` | portaria, admin | Procurar por código/QR, taxas, pagamento, isenção, terceiros autorizados, entrega com documento, QR e código ou assinatura |
| `/portaria/gate-pass/[id]` | portaria, admin | Gate Pass para imprimir |
| `/admin/tarifas` | admin | Tarifas e dias grátis de armazenagem |
| `/agent/collections` | agente | Recolhas no terreno com fotografia e OCR |
| `/exporter/*`, `/cv/*`, `/admin/*`, `/dashboard` | perfis respetivos | Plataforma de gestão (dados de exemplo) |

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e arranque |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (Vitest + Testing Library) |
| `npm run cypress:run` | Testes E2E (arranca o Next.js; **o backend tem de estar a correr**) |
| `npm run cypress:open` | Cypress interativo |

No terminal do VS Code, o Cypress precisa de `ELECTRON_RUN_AS_NODE` removido:
`env -u ELECTRON_RUN_AS_NODE npm run cypress:run`.

## Testes

- **Unitários:** domínio (validadores, tipos de carga, estados, países), cliente da API (token, renovação,
  erros), componentes.
- **E2E (Cypress) contra a API real:**
  - pedido sem conta → consulta com código e telefone → a agência aceita e agenda → o cliente vê a marcação;
  - pedido a partir dos EUA com criação de conta → aparece em `/cliente`;
  - encomenda com 2 volumes → validar → etiquetas → o QR é aceite pela verificação da API;
  - veículo incompleto → a validação lista os campos em falta → editar → validar;
  - encomenda repetida → alerta de duplicado → registar mesmo assim;
  - pedido de cliente recebido → abre a encomenda criada;
  - lista CSV com `;` → mapeamento sugerido → pré-visualização com uma linha errada → importar a válida;
  - contentor com dígito ISO 6346 errado e depois certo → BL Master → leitura do QR (e leitura repetida) → selar
    bloqueado por volume sem BL → associar → selar → viagem a 48 h com alerta → manifesto → envio → partida;
  - chegada → conferência por QR com localização → excesso registado → fecho → Alfândega valida o manifesto, canal
    verde, liberta com direitos → portaria paga, lê os QR, código de levantamento → Gate Pass;
  - recolha no terreno com OCR simulado (o Cypress injeta um resultado fixo de OCR).

Os testes E2E criam pedidos reais na base de dados de desenvolvimento do backend.

## Estrutura

```
src/
  app/                    rotas (App Router)
  components/             layout (app shell, cabeçalho público) e componentes de UI
  domain/                 regras de negócio puras (mesma origem que portus_service/src/domain)
  lib/                    api-client, config, permissões, utilitários
  modules/customer/       assistente de pedido, consulta e cartões de pedido
  modules/shipments/      formulário de encomenda, volumes, estados e QR
  modules/field-agent/    recolha no terreno e OCR
  modules/consolidation/  contentores, viagens e manifestos (estados, capacidade, exportação, formulário de viagem)
  modules/arrivals/       chegada, Alfândega e portaria (badges, fotografias protegidas, assinatura)
  services/api/           chamadas à API (auth, agências, pedidos, encomendas, importação, contentores, viagens)
  services/mock/          registo de empresas ainda simulado
  mocks/                  dados de exemplo das áreas ainda não ligadas à API
  store/                  estado de autenticação (Zustand)
cypress/e2e/              testes E2E
docs/                     plano de melhorias e manual de utilização
```

## Dependências principais

| Pacote | Para quê |
| --- | --- |
| `next` 16, `react` 19 | Framework e interface (React Compiler ativo) |
| `tailwindcss` 4 | Estilos; paleta `brand` e acento `star` em `src/app/globals.css` |
| `react-hook-form` + `zod` | Formulários e validação (os mesmos esquemas que a API) |
| `qrcode` | QR das etiquetas gerado no navegador (SVG) |
| `zustand` | Estado de autenticação |
| `lucide-react` | Ícones |
| `tesseract.js` | OCR em português no navegador (recolha no terreno) |
| `vitest`, `@testing-library/*`, `cypress` | Testes |

## Problemas comuns

| Sintoma | Causa / solução |
| --- | --- |
| "Não foi possível carregar as agências" em `/enviar` | A API não está a correr ou `NEXT_PUBLIC_API_URL` está errado |
| Erro de CORS na consola | Acrescente a origem do frontend a `CORS_ORIGIN` no `.env` do backend |
| Login dá "Email ou palavra-passe incorretos" com as contas de demo | Repor no backend: `npm run db:seed -- --reset-passwords` |
| Cypress: `bad option: --smoke-test` | Corra com `env -u ELECTRON_RUN_AS_NODE` |
| Mudou `NEXT_PUBLIC_API_URL` e nada mudou | A variável entra no build: reinicie o `npm run dev` |

### Imprimir etiquetas

Em `/agencia/encomendas/[id]/etiquetas` use **Imprimir**: o menu e o cabeçalho desaparecem e cada etiqueta fica
inteira numa página. Para impressoras de etiquetas (ex.: 100 × 150 mm), escolha esse tamanho de papel no diálogo
de impressão do navegador.
