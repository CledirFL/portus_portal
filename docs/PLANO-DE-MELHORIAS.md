# Plano de melhorias — PORTUS

Base: *Documento de Requisitos v1.0 (26/10/2026)* + pedido novo de **portal público do cliente**.
Data da análise: 02/11/2026.

> **Âmbito:** a plataforma cobre envios para Cabo Verde a partir de **qualquer país** onde os cabo-verdianos
> vivem ou compram (Portugal, França, Espanha, Américas, China, entre outros). O documento de requisitos fala
> de Portugal, mas é apenas um desses países de envio. O destino é sempre Cabo Verde. Na interface diz-se
> "país de onde envia" e não "país de origem", que é o país de fabrico das mercadorias (campo aduaneiro).

---

## 1. Diagnóstico do código atual

O PORTUS é hoje uma **demo só de frontend** (Next.js 16, React 19, Tailwind 4, Zustand, Zod).
Não existe servidor, base de dados nem API. Quase todas as páginas da Parte A mostram dados fixos
(`src/mocks/*`) e os formulários fazem `console.log` + `alert`.

| Área do requisito | Estado | Observação |
|---|---|---|
| Modelo de dados (secção 4) | 🟡 Parcial | Existem Exportador, Destinatário, Carga, Volume, Contentor, Navio, Documento. Faltam Encomenda, Agência, BL Master como entidade, Viagem, Manifesto (versões), Despacho, Levantamento, Ocorrência, Autorização de terceiro, Tipo de carga, Veículo, Tarifas, Auditoria real. |
| Estados do volume / contentor (BR 22) | 🔴 Falta | Estados atuais (`Pendente`, `Em armazém`…) não correspondem à secção 3.1. Não há máquina de estados nem validação de transições. |
| Tipos de carga (BR 32, secção 1.4) | 🔴 Falta | `cargoType` é texto livre. |
| Registo manual com validação (RF-A01) | 🟡 Parcial | Formulários existem mas não guardam nada. |
| Importação Excel/CSV (RF-A02–04, BR 6, 7, 9) | 🔴 Falta | — |
| Etiquetas QR (RF-A06, BR 5) | 🔴 Falta | Campo `qrCode` é só texto. |
| Consolidação / BL Master / capacidade (RF-A07–11, BR 10–11) | 🔴 Falta | Página BL é só listagem. |
| ISO 6346 (RF-A08) | 🔴 Falta | — |
| Viagem, manifesto, exportação, alerta 72 h (RF-A12–14) | 🔴 Falta | Página de manifestos é só listagem. |
| Desconsolidação por QR, ocorrências (RF-A17–20, BR 23) | 🔴 Falta | `/cv/conferencia` mostra só 3 números fixos. |
| Despacho, canal, bloqueios (RF-A21–23, BR 14–15) | 🔴 Falta | — |
| Taxas e pagamento (RF-A25–26, BR 21) | 🔴 Falta | — |
| Levantamento / Gate Pass (RF-A30–32, BR 18–20) | 🟡 Parcial | Gate Pass existe mas para camiões/contentores, não para levantamento de volume pelo destinatário. |
| Utilizadores e perfis (RF-A34, BR 28) | 🟡 Parcial | Perfis e menus por perfil existem; controlo é **só no ecrã** (cliente). Faltam perfis Alfândega, Terminal (Enapor), Portaria e Destinatário; falta âmbito por porto/agência. |
| Auditoria (RF-A35, BR 27) | 🔴 Falta | Página de auditoria mostra inspeções fixas, não registo de ações. |
| Painel (RF-A36) | 🟡 Parcial | Painel bonito mas com números inventados. |
| Veículos / VIN (RF-A39–43, BR 33) | 🔴 Falta | — |
| **Parte B — recolha no terreno** | 🟢 Bom começo | Formulário, OCR em português, confirmação obrigatória (BR 2), validação de NIF (BR 3), IndexedDB (base para offline). Falta: tipo de carga, vários volumes por encomenda, etiqueta QR, itens restritos, telefone com indicativo, envio para a Plataforma A, ID idempotente (BR 31). |
| Autenticação | 🔴 Demo | Palavra-passe única em código, sessão em `localStorage`. |
| Testes | 🟢 Base | Vitest (31 testes) e Cypress para o agente. |

### Problemas de design identificados
- A fonte Geist está carregada mas o `body` força `Arial` em `globals.css`.
- Ícones em emoji no menu (renderizam diferente em cada sistema, aspeto pouco profissional).
- Etiquetas misturadas em inglês e português (`Shipments`, `Containers`, `Exporter Dashboard`, `No data available`) e o perfil aparece como código (`cv_operator`).
- Cabeçalho repete “Portal de operações” em todas as páginas em vez do título da página e do utilizador.
- Cartões de métricas com números grandes sem contexto nem hierarquia; muitos tons de azul/cinza sem identidade.
- Tabelas sem estado vazio em português, sem pesquisa/filtros consistentes, sem densidade adequada.
- A página inicial fala de “exportação” e “TEUs”, não do produto real (encomendas de qualquer país para Cabo Verde).

---

## 2. Requisito novo: portal público do cliente

Um cliente (remetente) pode, **sem criar conta**:
1. Escolher o **país de onde envia** e a **agência** que vai tratar o envio (agências desse país, com cidade, ilhas servidas, contacto).
2. Escolher o **tipo de carga** de forma simples — *Caixa / encomenda pequena*, *Veículo*, *Mudança / móveis*, *Material de construção*, *Máquina / equipamento*, *Mercadoria comercial*, *Outro*.
3. Dar uma descrição curta e só os dados mínimos de cada tipo (ex.: caixa → nº de caixas e peso aproximado; carro → marca, modelo, ano).
4. Indicar contactos do remetente e do destinatário (ilha de destino).
5. Receber um **código de pedido** (ex.: `PED-7KQ2M9`) para acompanhar o estado.

Opcionalmente pode **criar conta** para ver todos os seus pedidos. A agência recebe o pedido numa
fila, aceita-o e converte-o numa recolha/encomenda (o mesmo fluxo e os mesmos estados da plataforma).

Estados do pedido: `Submetido → Aceite pela agência → Recolha agendada → Convertido em encomenda` (ou `Recusado`/`Cancelado`).

Regras propostas:
- **BR 41** – O pedido público não substitui a recolha: os dados só ficam “validados” quando a agência confirma (análogo à BR 2).
- **BR 42** – Sem conta, o pedido só é consultável com o código **e** o telefone do remetente (evita expor dados pessoais por adivinhação do código).
- **BR 43** – O tipo de carga do pedido é transportado para a encomenda e define os campos obrigatórios a completar pela agência (BR 32).

---

## 3. Decisão de arquitetura (a confirmar)

As regras BR 22, 27 e 28 exigem validação **no servidor**. A demo atual não tem servidor.
Proposta:

- **Já (Fase 1):** toda a lógica de negócio passa para `src/domain/*` em TypeScript puro (sem React),
  testada com Vitest. Os dados passam por uma camada de *repositório* (`src/data/*`) que hoje grava
  no navegador. Assim a demo continua a funcionar sem infraestrutura.
- **Fase 2 técnica:** trocar o repositório por Route Handlers / Server Actions do Next + PostgreSQL
  (Prisma ou Drizzle) + autenticação real. A lógica de `src/domain` é reutilizada sem alterações.

> ❓ Decisão do cliente: alojamento e base de dados (ex.: Postgres gerido na Vercel/Neon/Supabase, ou servidor próprio em Cabo Verde por questões de proteção de dados — BR 30).

---

## 4. Plano por fases

### Fase 1 — Fundações + design + portal do cliente *(em curso)*
- [x] Sistema de design: tokens de cor e tipografia, ícones SVG, cabeçalho de página, cartões de métrica, menus em português, nome legível dos perfis.
- [x] Domínio: tipos de carga (BR 32), máquina de estados do volume e do contentor (BR 22), validação ISO 6346 com dígito de controlo (RF-A08), VIN (RF-A40), NIF e telefone CV/PT (BR 3).
- [x] Portal público do cliente: `/enviar` (assistente em passos), `/acompanhar` (consulta por código + telefone), conta opcional, área `/cliente`.
- [x] Fila de pedidos para a agência (`/agencia/pedidos`): aceitar, agendar recolha, recusar.
- [x] Nova página inicial focada no produto real.

### Fase 2 — Núcleo da Plataforma A (MVP)
- [x] Entidades Encomenda, Volume (novo modelo), Agência; registo manual por tipo de carga (RF-A01, RF-A39). *(B3)*
- [x] Etiquetas QR imprimíveis (RF-A06, BR 5). *(B3)*
- [x] Importação `.xlsx`/`.csv` com mapeamento de colunas, relatório de erros e duplicados (RF-A02–04). *(B4)*
- [x] Contentor + BL Master: associar volumes, bloqueio de capacidade, selo, fecho (RF-A07–11). *(B5)*
- [x] Viagem + manifesto com exportação `.xlsx`/`.pdf`/`.csv` e alerta de 72 h (RF-A12–14). *(B5)*
- [x] Auditoria real com valores antes/depois em todas as escritas (BR 27). *(B1, em todas as fases)*

### Fase 3 — Chegada a Cabo Verde (MVP)
- [x] Desconsolidação por leitura de QR (câmara), ocorrências com fotos, localização no armazém (RF-A17–20). *(B6)*
- [x] Despacho manual: canal verde/vermelho, retenção/libertação com histórico, bloqueio sem manifesto validado (RF-A21–23). *(B6)*
- [x] Tarifas configuráveis e cálculo de taxas, registo de pagamento/isenção (RF-A25–26). *(B6)*
- [x] Levantamento: validação de documento + QR, terceiros autorizados, Gate Pass, estado Entregue (RF-A30–32). *(B6)*
- [x] Novos perfis: Alfândega, Terminal, Portaria; âmbito por porto/agência. *(B6; o portal do destinatário fica por fazer)*
- [x] Painel com dados reais (RF-A36). *(B8; relatórios exportáveis RF-A37 por fazer)*

### Fase 4 — Parte B completa (MVP-B)
- [ ] Recolha com tipo de carga e vários volumes; telefone com indicativo; itens restritos (BR 26).
- [ ] Etiqueta QR na recolha, ID gerado no dispositivo (BR 31), fila offline e sincronização (BR 29).
- [ ] Converter pedido público em recolha com um clique.

### Fase 5 — Backend real e segurança
- [ ] Postgres + API, autenticação forte, 2FA para Alfândega/Enapor/admin, permissões no servidor (BR 28), cifragem e retenção (BR 30), backups.

### Fase 5b — Multi-idioma
- [ ] Internacionalização (locale) da interface e das mensagens da API; português como idioma base.

### Fase 6 — Fase 2/3 do documento
- [x] Rastreio público com estados reais até à entrega e emails ao cliente. *(B8)*
- [x] Gestão de utilizadores, pedidos de acesso e auditoria consultável (RF-A34–35). *(B8)*
- [x] Abandono por prazo de armazenagem com aviso (BR 25). *(B8)*
- [ ] SMS, pagamentos eletrónicos, decodificação de VIN por API, estimativa de despacho com tarifas versionadas, integrações Alfândega/Enapor/RNI/GOV.CV.
