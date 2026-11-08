# Manual de utilização e testes do Portus

Este manual explica como usar o Portus do princípio ao fim: desde o pedido do cliente num país de envio até ao
levantamento da carga em Cabo Verde, no porto ou na agência em Cabo Verde. Segue a ordem real do processo e, em cada etapa, diz **quem** faz, **onde**,
**que passos** seguir e **o que verificar**.

Serve também de roteiro de testes. Marque cada ☐ à medida que testa. Quando algo falhar, faltar ou puder
melhorar, use o botão **Reportar problema** no cabeçalho do portal (ver [a secção 9](#9-registo-de-problemas)).

Legenda:

- ✅ **Funciona**: guarda no servidor e pode testar de ponta a ponta.
- 🧪 **Demonstração**: o ecrã existe, mas mostra dados fictícios e não guarda nada.
- ⏳ **Por construir**: ainda não existe.

**Índice**

1. [Preparação](#1-preparação): arrancar, contas de demonstração, dicas
2. [Visão geral do processo](#2-visão-geral-do-processo): etapas, estados e menus de cada perfil
3. [Etapas no país de envio](#3-etapas-no-país-de-envio): pedido, agência, encomenda, contentor, viagem
4. [Etapas em Cabo Verde](#4-etapas-em-cabo-verde): chegada, Alfândega, levantamento no porto, agência em Cabo Verde,
   viaturas (desalfandegamento pelo dono, inspeção e matrícula da DGTR)
5. [Administração](#5-administração-): super admin e administrador da plataforma, perfis de administração, painel,
   utilizadores, agências, registo de atividade, tarifas, problemas reportados, bloqueios
6. [Casos especiais a testar](#6-casos-especiais-a-testar)
7. [O que ainda não existe](#7-o-que-ainda-não-existe-não-registar-como-erro)
8. [Testes de ponta a ponta](#8-testes-de-ponta-a-ponta): encomenda pequena; viatura, da morada do dono à matrícula em Cabo Verde
9. [Registo de problemas](#9-registo-de-problemas)
10. [Glossário](#10-glossário)

---

## 1. Preparação

### 1.1 Arrancar a plataforma

1. Base de dados e emails: em `portus_service`, `docker compose up -d`. Arranca o PostgreSQL (porta 5435) e o
   **Mailpit**, que apanha os emails enviados pela plataforma.
2. Backend: em `portus_service`, `npm run dev`. A API fica em `http://localhost:4000/api`.
3. Portal: em `portus`, `npm run dev`. O portal fica em `http://localhost:3000`.
4. Se faltarem contas ou agências: em `portus_service`, `npm run db:seed`.
5. **Caixa de correio de testes:** <http://localhost:8025>. Todos os emails da plataforma (para clientes e equipa)
   aparecem aqui; nenhum sai para a Internet.

### 1.2 Contas de demonstração

Todas usam a palavra-passe `PortusDemo!2026-CV`. As contas do porto estão no **porto da Praia**.

| Conta | Perfil | Onde trabalha | Página inicial |
|---|---|---|---|
| *(sem conta)* | Cliente | — | `/enviar`, `/acompanhar` |
| `cliente@portus.cv` | Cliente com conta (Rosa Tavares) | — | Os meus pedidos |
| `agente@portus.cv` | Agente de recolha | Agência Morabeza Envios, Lisboa | Recolhas |
| `transitario@portus.cv` | Transitário | Agência Morabeza Envios, Lisboa | Viagens e manifestos |
| `carla@portus.cv` | Agente marítimo | Porto da Praia | Chegadas |
| `terminal@portus.cv` | Operador do terminal | Porto da Praia | Chegadas e conferência |
| `alfandega@portus.cv` | Alfândega | Porto da Praia | Despacho aduaneiro |
| `portaria@portus.cv` | Portaria | Porto da Praia | Levantamentos |
| `dgtr@portus.cv` | Técnico da DGTR (Carlos Gomes) | Porto da Praia | Inspeção e matrícula |
| `agencia.praia@portus.cv` | Agência em Cabo Verde (Edna Tavares) | Morabeza Praia: Santiago, Maio, Fogo, Brava | Encomendas a entregar |
| `agencia.mindelo@portus.cv` | Agência em Cabo Verde (Hélio Lima) | Morabeza Mindelo: São Vicente, Santo Antão, São Nicolau, Sal, Boa Vista | Encomendas a entregar |
| `joao@portus.cv` | Super admin (dono da plataforma) | Tudo, incluindo administradores, perfis e bloqueios | Painel geral |
| `governo@portus.cv` | Administrador da plataforma (Marta Lopes), perfil "Governo — supervisão" | Painel, registo de atividade e operações **só em consulta** | Painel geral |
| `ana@portus.cv` | Exportador | — | Área em preparação ⏳ |
| `bruno@portus.cv` | Transitário | — | Pedido de acesso em revisão: **não entra** até o administrador o aprovar |
| `duarte@portus.cv` | Operador do terminal | — | Conta bloqueada: **não entra** |

### 1.3 Dicas antes de testar

- **Use janelas separadas para cada perfil.** A sessão fica guardada no navegador, por isso para ter o cliente e
  o agente abertos ao mesmo tempo use uma janela normal e uma janela anónima (ou dois navegadores). Sem isso, tem
  de fazer **Sair** e entrar com a outra conta.
- **Não precisa de leitor de QR.** Onde a plataforma pede o QR, pode escrever o **código do volume** (ex.:
  `ENC-88CYMC-01`) e carregar Enter. Os códigos aparecem na tabela de volumes de cada encomenda. Um leitor USB, ou
  a câmara do telemóvel, lê o QR das etiquetas impressas.
- **O NIF do destinatário é obrigatório** (9 algarismos, ex.: `123456789`) no pedido, no registo da agência e na
  importação. Só as encomendas antigas, de antes desta regra, podem não ter NIF.
- **A viagem tem de chegar à Praia** (`CVRAI`), porque as contas do porto só veem esse porto.
- **Encomendas pequenas vão para a agência em Cabo Verde.** Uma caixa enviada pela Morabeza (Lisboa) é entregue
  pela Morabeza Praia ou Mindelo, conforme a ilha. Para testar a **portaria do porto**, use uma carga grande (por
  exemplo, uma **mudança**).
- **Use emails inventados** nos pedidos (ex.: `rosa@teste.pt`). Os emails vão todos para o Mailpit
  (<http://localhost:8025>); ninguém os recebe de verdade.

---

## 2. Visão geral do processo

```
 PAÍS DE ENVIO                                                     CABO VERDE
 ─────────────────────────────────────────────────                 ───────────────────────────────────────
 1 Cliente      2 Agência        3-4 Agente/Agência   5-6 Transitário    7 Terminal     8 Alfândega   9 Portaria
 faz pedido  →  aceita/agenda →  recebe, valida,   →  contentor,     →  chegada,    →  manifesto, →  taxas,
                                 etiqueta,            viagem,           conferência    canal,        entrega,
                                 comprovativo         manifesto,        por QR         libertação    Gate Pass
                                                      partida                                  │     (carga grande)
                                                                                               │
                                                                                               └──→ 10 Agência em CV
                                                                                                    levanta no porto,
                                                                                                    recebe, cobra,
                                                                                                    entrega
                                                                                                    (encomendas pequenas)
```

| # | Etapa | Quem | Estado do volume depois | Estado |
|---|---|---|---|---|
| 1 | Pedido de envio | Cliente | — | ✅ |
| 2 | Tratar o pedido | Agência (agente de recolha) | — | ✅ |
| 3 | Receber a carga e criar a encomenda | Agente de recolha | Rascunho | ✅ |
| 3b | Importar uma lista de encomendas | Agente ou transitário | Rascunho | ✅ |
| 4 | Validar e etiquetar | Agente de recolha | **Recolhido** | ✅ |
| 5 | Consolidar no contentor | Transitário | **Consolidado** | ✅ |
| 6 | Viagem, manifesto e partida | Transitário | **Embarcado** | ✅ |
| 7 | Chegada e conferência | Terminal / agente marítimo | **Chegado → Desconsolidado** | ✅ |
| 8 | Despacho aduaneiro | Alfândega | **Liberado** (ou **Retido**) | ✅ |
| 9 | Taxas e levantamento no porto (carga grande) | Portaria | **Entregue** | ✅ |
| 10 | Agência em Cabo Verde (encomendas pequenas) | Agência em Cabo Verde | **A caminho da agência → Na agência → Entregue** | ✅ |
| 11 | Viaturas: desalfandegamento pelo dono, inspeção e matrícula | Dono, Alfândega, técnico da DGTR | **Liberado** (com a matrícula) → **Entregue** na portaria | ✅ |
| — | Carga não levantada no prazo | Automático (prazo nas Tarifas) | **Abandonado** | ✅ |
| — | Acompanhamento e emails | Cliente | — | ✅ até à entrega |
| — | Administração, registo de atividade e bloqueios | Super admin / administrador da plataforma | — | ✅ |

> **Encomendas pequenas e carga grande.** As **encomendas pequenas** (caixas) são entregues por uma **agência em
> Cabo Verde** ligada à agência de envio: depois da Alfândega, a agência levanta-as no porto, leva-as para as suas
> instalações e entrega-as ao destinatário (etapa 10). A **carga grande** (veículos, mudanças, paletes, carga
> comercial) levanta-se na **portaria do porto** (etapa 9). Se a agência de envio não tiver nenhuma agência em Cabo
> Verde ligada, as encomendas pequenas também se levantam no porto.

> **Agência e agente de recolha.** A agência não tem uma conta própria. Quem trabalha nela entra como **agente
> de recolha** e trata os pedidos e as encomendas da agência. O **transitário** é da mesma agência e trata do
> contentor e da viagem. O **administrador** pode fazer tudo, em todas as agências.

### Menus de cada perfil

Cada conta vê só o que lhe diz respeito. Toda a equipa tem também o botão **Reportar problema** no cabeçalho.

| Perfil | Menus |
|---|---|
| Cliente (com conta) | Os meus pedidos · As minhas viaturas |
| Agente de recolha | Recolhas 🧪 · Nova recolha 🧪 · Pedidos de clientes · Encomendas · Importar lista |
| Transitário | Viagens e manifestos · Contentores · Encomendas · Importar lista |
| Agente marítimo | Chegadas |
| Operador do terminal | Chegadas e conferência |
| Alfândega | Despacho aduaneiro · Viaturas |
| Técnico da DGTR | Inspeção e matrícula |
| Portaria | Levantamentos |
| Agência em Cabo Verde | Encomendas a entregar · Entregar ao destinatário |
| Super admin | Painel geral · Utilizadores · Perfis de administração · Agências · Pedidos de clientes · Encomendas · Importar lista · Contentores · Viagens e manifestos · Chegadas e conferência · Despacho aduaneiro · Viaturas (desalfandegamento) · Inspeção e matrícula (DGTR) · Levantamentos · Agências em Cabo Verde · Tarifas · Registo de atividade · Problemas reportados · Bloqueios |
| Administrador da plataforma | Só os menus das permissões do seu perfil de administração (ex.: "Governo — supervisão": Painel geral · as operações em consulta · Registo de atividade) |
| Exportador | Início (área em preparação ⏳) |

---

## 3. Etapas no país de envio

### Etapa 1 — Cliente: fazer o pedido ✅

**Quem:** cliente (remetente), sem conta.
**Onde:** página inicial → **Enviar encomenda** (`/enviar`).

1. **O que vai enviar:** escolha o tipo de carga (encomendas pequenas, veículos, paletes…), escreva a descrição e
   preencha os dados que o tipo pede (por exemplo, a quantidade ou, num veículo, a marca e o modelo).
2. **Destino e agência:**
   - país de onde envia (vem preenchido conforme a sua localização e pode ser mudado);
   - ilha de destino;
   - agência (só aparecem as que servem esse país, essa carga e essa ilha);
   - como entrega a carga: **recolha** na sua morada (só nas agências que fazem recolha) ou **entrega na
     agência**.
3. **Contactos:** remetente (o indicativo do telefone é preenchido conforme o país), com **email**, e destinatário.
   O **NIF do destinatário** é obrigatório.
4. **Confirmar:** reveja tudo. Se quiser, crie uma conta (opcional) e envie. Quem já tem sessão iniciada vê "Quem envia"
   preenchido com os dados da conta (pode alterar).

No fim aparece o **código do pedido** (ex.: `PED-7KQ2M9`), com um botão para o copiar, e o **link do seu pedido**.
Com email indicado, chega também um email com o código e o botão **Ver ou cancelar o pedido**.

**O que verificar**
- ☐ O país vem preenchido com o país onde está e pode ser mudado.
- ☐ A lista de agências muda conforme o país, a carga e a ilha.
- ☐ A opção de recolha só aparece nas agências que a fazem.
- ☐ Os campos obrigatórios mostram erro se ficarem vazios.
- ☐ Recebe o código `PED-…` no fim.
- ☐ O email "Pedido PED-… recebido" chega ao Mailpit e o botão abre o pedido (`/pedido/…`).
- ☐ Sem NIF do destinatário, ou com um NIF que não tem 9 algarismos, não avança.
- ☐ Com conta criada, o pedido aparece em **Os meus pedidos** (`/cliente`).
- ☐ **Viatura:** escolha o **uso da viatura em Cabo Verde** (particular, táxi, emigrante, elétrico), o ano, o estado e o
  valor de compra: aparece a **estimativa dos impostos** (direitos, ICE, taxa específica, taxa comunitária e IVA). Com
  **Táxi** e uma viatura usada, ou acima de 1400 cm³, aparece o aviso de que o regime não se aplica.

### Etapa 2 — Agência: tratar o pedido ✅

**Quem:** `agente@portus.cv` (ou administrador).
**Onde:** **Pedidos de clientes** (`/agencia/pedidos`).

A fila tem três separadores: **Por tratar**, **Em curso** e **Fechados**. Abra um pedido para ver os dados e as
ações:

| Ação | Quando | Estado seguinte |
|---|---|---|
| **Aceitar** (nota opcional para o cliente) | Submetido | Aceite |
| **Recusar** (motivo obrigatório) | Submetido | Recusado |
| **Agendar** (data e hora da recolha, ou da entrega na agência) | Aceite | Recolha agendada |
| **Carga recebida (criar encomenda)** | Aceite ou agendado | Carga recebida |
| **Cancelar** (motivo obrigatório) | Aceite ou agendado | Cancelado |

**O que verificar**
- ☐ O pedido feito na etapa 1 aparece em **Por tratar**, com os contadores certos nos separadores.
- ☐ Recusar e cancelar não avançam sem motivo.
- ☐ Agendar não aceita datas passadas.
- ☐ O agente só vê os pedidos da sua agência.
- ☐ A cada ação (aceitar, agendar, recusar, cancelar, carga recebida) o cliente recebe um email; o do agendamento
  tem a data na hora local da agência.

### Etapa 3 — Agente de recolha: receber a carga ✅

**Quem:** `agente@portus.cv`.

**Caminho A: a carga vem de um pedido**
1. Vá buscar a carga à morada (ou receba-a no balcão).
2. Em **Pedidos de clientes**, no pedido, clique em **Carga recebida (criar encomenda)**.
3. É criada uma **encomenda em rascunho** (ex.: `ENC-88CYMC`) com os dados do pedido, e há uma ligação do pedido
   para a encomenda.

**Caminho B: o cliente aparece no balcão sem pedido**
1. **Encomendas** → **Nova encomenda** (`/agencia/encomendas/nova`).
2. Preencha a carga, o remetente, o destinatário (o **NIF é obrigatório**; o documento ajuda no levantamento) e os volumes.
3. Numa **encomenda pequena**, o campo **Agência em Cabo Verde** mostra as agências ligadas que servem a ilha do
   destinatário. Com uma só, fica escolhida sozinha; com várias, escolha a que o cliente preferir.

**O que verificar**
- ☐ A encomenda criada a partir do pedido traz o remetente, o destinatário, a carga e a ilha.
- ☐ O pedido passa para **Fechados** com o estado **Carga recebida**.
- ☐ Na lista **Encomendas** a nova encomenda aparece primeiro; a pesquisa e os separadores funcionam.
- ☐ A paginação funciona (10, 25, 50 ou 100 por página).

> O menu **Recolhas / Nova recolha** (`/agent/collections`) é um **protótipo para trabalhar sem internet**: tem
> fotografia e leitura de documento, mas guarda só no navegador e não envia nada ao servidor 🧪. O fluxo real usa
> **Pedidos de clientes** e **Encomendas**.

### Etapa 3b — Importar uma lista de encomendas ✅ (alternativa à etapa 3)

**Quem:** agente de recolha ou transitário.
**Onde:** **Importar lista** (`/agencia/importar`).

Serve para agências que já têm as encomendas numa folha de cálculo.

1. Se precisar, descarregue o **modelo** `.csv`.
2. Envie o ficheiro `.xlsx` ou `.csv`.
3. Confirme qual coluna corresponde a cada campo. A plataforma tenta adivinhar.
4. Veja a pré-visualização: as linhas com erro aparecem com a linha, a coluna e o motivo, e os duplicados são
   assinalados.
5. Importe. Só entram as linhas válidas, como encomendas em rascunho.

**O que verificar**
- ☐ Um ficheiro com erros mostra cada erro com a linha e a coluna.
- ☐ A coluna do NIF do destinatário é obrigatória; uma linha sem NIF aparece como erro.
- ☐ Só as linhas válidas são importadas.
- ☐ Ao importar o mesmo ficheiro duas vezes, os duplicados são detetados.

### Etapa 4 — Agente de recolha: validar e etiquetar ✅

**Quem:** `agente@portus.cv`.
**Onde:** **Encomendas** → abrir a encomenda.

1. **Editar dados:** complete o que faltar. Os campos obrigatórios dependem do tipo de carga; um veículo, por
   exemplo, precisa do VIN, da marca, do modelo, do ano, da cilindrada, do combustível, do estado e do valor.
2. **Acrescentar volume:** um por caixa, veículo ou palete, com o peso e as medidas (ou o volume em m³). Os volumes
   podem ser editados e removidos, e os números ajustam-se.
3. **Validar.**
   - Se faltar algum dado, a plataforma lista o que falta.
   - Se houver uma **possível encomenda duplicada** (mesmo nº de guia; mesmo remetente, destinatário e peso no
     mesmo dia; ou um veículo com o mesmo VIN noutra encomenda ativa), mostra-a. O agente decide se continua.
4. A encomenda fica **Validada** e cada volume fica **Recolhido**.
5. **Imprimir etiquetas:** uma por volume, com um QR assinado. Cole cada uma no volume certo.
6. **Encomenda pequena: comprovativo para o remetente.** Ao validar, nasce o **código de levantamento** (`LEV-…`).
   Clique em **Comprovativo** e imprima-o: tem a encomenda, os volumes, a **agência em Cabo Verde** que entrega
   (morada e telefone), o código e um QR. O remetente recebe-o também por email e pode reencaminhá-lo a quem vai
   levantar.
7. Leve os volumes para o armazém da agência. Ficam à espera de contentor.

Uma encomenda, em rascunho ou já validada, pode ser **cancelada** com motivo.

**O que verificar**
- ☐ Validar sem volumes ou sem um campo obrigatório mostra exatamente o que falta.
- ☐ O aviso de duplicado aparece (também para um VIN repetido) e deixa continuar.
- ☐ As etiquetas imprimem uma por volume, com o código `ENC-…-01`, `-02`…
- ☐ Depois de validada, a encomenda já não se edita.
- ☐ Numa encomenda pequena, o detalhe mostra o cartão **Levantamento em Cabo Verde** com a agência e o código, e o
  email "Comprovativo de envio ENC-…: código de levantamento LEV-…" chega ao Mailpit.
- ☐ Numa ilha servida por duas agências ligadas, validar sem escolher pede "Escolha a agência em Cabo Verde…".
- ☐ **Viatura:** a encomenda mostra a estimativa dos impostos e o cartão **Transporte e seguro**, "Por pagar". Registe o
  pagamento (valor, moeda, meio, recibo): passa a "Pago". **Sem este pagamento a viatura não entra no contentor nem o
  navio parte.**

### Acompanhamento pelo cliente ✅ (em qualquer momento)

O cliente acompanha o pedido de três formas:
- **Link do email** (`/pedido/…`): sem conta e sem escrever nada.
- **Acompanhar pedido** (`/acompanhar`): com o código do pedido e o telefone do remetente.
- **Os meus pedidos** (`/cliente`): com conta de cliente.

**Criar conta de cliente:** no ecrã de entrada, **Criar conta de cliente** (`/criar-conta`): nome, email, telefone e
palavra-passe. A pessoa entra logo em **Os meus pedidos**. Também se pode criar no último passo do pedido.

**Juntar pedidos feitos sem conta:** se já fez pedidos sem conta com o **mesmo email** da conta, aparece em Os meus
pedidos a caixa "Tem N pedidos feitos sem conta…". Clique em **Juntar à minha conta**, escreva o código de 6
algarismos que chega por email (vale 15 minutos, 5 tentativas) e **Confirmar**: os pedidos passam para a conta.

**Antes de a agência receber a carga**, vê o estado (**Submetido → Aceite → Recolha agendada**), a data marcada e as
notas da agência, e pode **cancelar o pedido** (com motivo opcional). Recebe um email a confirmar.

**Depois de "Carga recebida"**, vê a **linha do tempo da encomenda**: recebida na agência → etiquetada → no
contentor → em viagem (navio e chegada prevista) → chegou a Cabo Verde → pronta para levantar → entregue. Quando a
carga está pronta, aparece o **código de levantamento** `LEV-…` (para passar ao destinatário), o porto e as taxas
a pagar nesse dia. Também recebe um email em cada marco: em viagem, chegou, pronta para levantar e entregue.

Numa **encomenda pequena** entregue pela agência em Cabo Verde, a linha do tempo tem mais dois marcos: **liberada pela
Alfândega → a caminho da agência → pronta para levantar na agência → entregue**. O código e as taxas aparecem quando
a carga chega à agência, com o nome e a morada da agência; o email é "Pronta para levantar na agência".

**O que verificar**
- ☐ Com o telefone errado, o pedido não aparece. Um link alterado mostra "Este link não é válido".
- ☐ Uma conta nova com o email de pedidos antigos junta-os com o código; com o código errado diz quantas tentativas restam.
- ☐ O estado, a data e a nota mudam depois de cada ação da agência.
- ☐ Cancelar funciona até a agência receber a carga; depois o botão desaparece.
- ☐ A linha do tempo avança com a carga (etapas 4 a 9) e não mostra a localização no armazém nem a inspeção.
- ☐ Os emails dos marcos chegam ao Mailpit; o de "pronta para levantar" tem o código e as taxas.

### Etapa 5 — Transitário: consolidar no contentor ✅

**Quem:** `transitario@portus.cv`.
**Onde:** **Contentores** (`/agencia/contentores`).

1. **Novo contentor:**
   - escreva o número; a plataforma valida-o pela norma **ISO 6346** enquanto escreve e, se o último algarismo
     estiver errado, diz qual devia ser (exemplo válido: `CSQU3054383`);
   - escolha o tipo (20', 40', high cube…); a carga máxima e o volume são preenchidos e podem ser ajustados;
   - indique o armador e clique em **Registar contentor**.
2. **Acrescentar BL Master:** LCL para grupagem, FCL para contentor completo, com limite de peso opcional. As
   encomendas pequenas de várias pessoas ficam sob o mesmo BL Master.
3. **Ler volumes:** escolha o BL Master e leia o QR (ou escreva o código) de cada volume. O volume passa a
   **Consolidado**.
4. **Retirar:** tira um volume do contentor aberto, com motivo.
5. **Selar e fechar:** escreva o nº do selo. Não fecha enquanto houver volumes sem BL Master: a mensagem diz quais.
   Escolha o BL de cada um na tabela e sele de novo.
6. **Reabrir contentor:** antes da partida, com motivo. O selo fica quebrado.
7. Lista de carga do contentor em `.xlsx`, `.pdf` ou `.csv`.

**O que verificar**
- ☐ Um número de contentor errado é recusado, com o algarismo certo indicado.
- ☐ Ao ler o mesmo volume duas vezes aparece "Já estava neste contentor".
- ☐ Uma etiqueta falsificada, ou de um volume não validado, é recusada.
- ☐ Ao ultrapassar o peso ou o volume do contentor ou do BL Master, a leitura é **bloqueada** e é pedida uma
  recontagem.
- ☐ Não sela com volumes sem BL Master.
- ☐ Uma viatura sem o transporte e o seguro pagos é recusada: "A viatura ENC-… não tem o transporte e o seguro pagos".
- ☐ Os ficheiros exportados abrem e têm os volumes.

### Etapa 6 — Transitário: viagem, manifesto e partida ✅

**Quem:** `transitario@portus.cv`.
**Onde:** **Viagens e manifestos** (`/agencia/viagens`).

1. **Nova viagem:** navio, nº da viagem, porto de embarque (ex.: `PTLIS` Lisboa, `FRLEH` Le Havre, `USBOS`
   Boston), porto de chegada (**Praia** para testar com as contas de Cabo Verde), partida (ETD) e chegada (ETA).
2. **Associar** os contentores selados.
3. **Gerar nova versão** do manifesto. Se houver um contentor aberto ou volumes sem BL Master, a versão fica
   **incompleta** e a plataforma diz o que falta.
4. Descarregue o manifesto (`.xlsx`, `.pdf`, `.csv`), envie-o à Alfândega e à Enapor pelos canais habituais e
   clique em **Registar envio**.
5. **Alerta das 72 horas:** quando faltam menos de 72 horas para o ETA sem manifesto enviado, a viagem mostra um
   aviso vermelho. Se a carga mudar depois do envio, o manifesto fica **desatualizado** e o aviso volta.
6. **Registar partida:** exige todos os contentores selados. Contentores e volumes passam a **Embarcado**, e a
   viagem a **Em viagem**.

**O que verificar**
- ☐ Uma viagem com ETA a menos de 72 horas e sem manifesto mostra o alerta, também na lista de viagens.
- ☐ O alerta desaparece depois de **Registar envio**.
- ☐ Ao reabrir um contentor depois do envio, o manifesto fica desatualizado e o alerta volta.
- ☐ O manifesto tem os volumes por contentor e BL Master, os totais e os proprietários.
- ☐ Não regista a partida com contentores por selar.
- ☐ Na partida, o remetente recebe o email "A sua carga está a caminho de Cabo Verde" com a chegada prevista.

---

## 4. Etapas em Cabo Verde

### Etapa 7 — Terminal: chegada e conferência ✅

**Quem:** `terminal@portus.cv` (ou `carla@portus.cv`). Cada conta vê só o seu porto.
**Onde:** **Chegadas e conferência** (`/cv/chegadas`).

1. Em **A caminho**, abra o navio e clique em **Registar chegada**. Contentores e volumes passam a **Chegado**.
2. Abra o contentor. Escreva a **localização no armazém** (ex.: `B-04-2`) e leia cada volume. O volume passa a
   **Desconsolidado** nessa localização. A localização mantém-se para as leituras seguintes até a mudar.
3. Um volume que não pertence a este contentor gera um aviso, com a opção **Registar excesso**.
4. **Ocorrência** num volume: dano, selo violado ou falta, com descrição e **fotografias** (no telemóvel abre a
   câmara).
5. **Fechar desconsolidação:** só fecha quando todos os volumes estão conferidos ou têm ocorrência. Se faltar
   algum, a mensagem diz quais.

**O que verificar**
- ☐ A viagem que partiu na etapa 6 aparece em **A caminho**.
- ☐ Cada volume lido aparece com a localização.
- ☐ O excesso e as ocorrências ficam registados, com as fotografias.
- ☐ Não fecha com volumes por conferir.
- ☐ Ao registar a chegada, o remetente recebe o email "A sua carga chegou a Cabo Verde".
- ☐ ⏳ Contra-Marca: ainda não existe.

### Etapa 8 — Alfândega: despacho ✅

**Quem:** `alfandega@portus.cv`.
**Onde:** **Despacho aduaneiro** (`/alfandega`).

1. Em cada navio aparece o manifesto enviado. **Valide-o** com a referência da Alfândega, ou **rejeite-o** com
   motivo (o transitário tem de enviar nova versão). **Sem manifesto validado não se liberta nenhuma encomenda.**
2. **Despachar encomendas:** cada encomenda mostra o destinatário, os volumes, as ocorrências e a **sugestão de
   canal**. A sugestão é vermelho quando há divergência, selo violado, dano ou destinatário sem NIF nem documento;
   verde nos outros casos.
3. Atribua o canal (**Canal verde** ou **Canal vermelho**; no vermelho, escreva o resultado da inspeção).
4. **Reter**, com motivo: os volumes ficam **Retido**. Ou **Libertar**, com os direitos em CVE: os volumes ficam
   **Liberado** e aparece o **código de levantamento** (`LEV-…`). Numa encomenda pequena é o mesmo código do
   comprovativo, criado ao validar.
5. O remetente recebe por email o código e as taxas, e vê-os na linha do tempo. Ao destinatário, por agora, o código
   chega pelo remetente ou à mão (⏳ o SMS ainda não existe).

**O que verificar**
- ☐ Não liberta nada antes de validar o manifesto.
- ☐ A sugestão de canal muda com as ocorrências registadas na etapa 7.
- ☐ Uma encomenda retida pode ser libertada depois.
- ☐ O código `LEV-…` aparece depois de libertar e chega ao remetente no email "Carga pronta para levantar".
- ☐ Numa encomenda pequena, o email é "Carga liberada pela Alfândega" e diz que a agência em Cabo Verde vai levantá-la.

### Etapa 9 — Portaria: taxas e levantamento ✅

**Quem:** `portaria@portus.cv`.
**Onde:** **Levantamentos** (`/portaria`).

Para a **carga grande** (veículos, mudanças, paletes, carga comercial). As encomendas pequenas entregues por uma
agência em Cabo Verde são recusadas aqui: ver a etapa 10.

1. Procure pelo **código de levantamento**, pelo **QR** de um volume ou pelo código da encomenda.
2. **Taxas:** manuseamento por volume, armazenagem por dia depois dos dias grátis, e os direitos. Registe o
   **pagamento** (numerário, cartão ou transferência, com o recibo) ou a **isenção** com o fundamento. Sem uma das
   duas não há entrega.
3. **Terceiro autorizado:** se for outra pessoa a levantar, registe primeiro a autorização, com o nome, o NIF, o
   documento e a validade.
4. **Entregar:**
   - escolha quem levanta e escreva o nº do documento apresentado; tem de coincidir com o registado na encomenda
     ou, se não houver documento registado, o NIF tem de coincidir;
   - leia o QR de cada volume;
   - peça o **código de levantamento** ou a **assinatura** no ecrã.
5. É emitido o **Gate Pass** (`GP-…`) para imprimir. Os volumes ficam **Entregue**.

**O que verificar**
- ☐ As taxas batem certo com as tarifas (admin → **Tarifas**).
- ☐ Não entrega sem pagamento ou isenção.
- ☐ Um documento ou NIF errado é recusado.
- ☐ Um terceiro sem autorização, ou com a autorização caducada, é recusado.
- ☐ O Gate Pass mostra os volumes, quem levantou e o pagamento.
- ☐ Uma encomenda **antiga** sem NIF nem documento do destinatário não consegue ser entregue (as novas já têm NIF
  obrigatório).
- ☐ Na entrega, o remetente recebe o email "Carga entregue" e a linha do tempo fica completa.
- ☐ Uma encomenda pequena com agência em Cabo Verde é recusada: "Esta encomenda é entregue pela agência em Cabo
  Verde, não no porto."

### Etapa 10 — Agência em Cabo Verde: levantar, receber e entregar ✅

**Quem:** `agencia.praia@portus.cv` (Santiago, Maio, Fogo, Brava) ou `agencia.mindelo@portus.cv` (Barlavento, Sal,
Boa Vista). Cada conta vê só as encomendas da sua agência.
**Onde:** **Encomendas a entregar** (`/agencia-cv`) e **Entregar ao destinatário** (`/agencia-cv/entregar`).

A agência trata do despacho das encomendas pequenas, leva-as do porto para as suas instalações e entrega-as. Os
separadores mostram cada etapa, com o número de encomendas: **Liberadas no porto**, **A caminho**, **Na agência**,
**Entregues** e **Ainda no porto** (no navio, na conferência ou na Alfândega).

1. **Levantar no porto:** em **Liberadas no porto**, marque as encomendas que a agência levantou e clique em
   **Levantar no porto**. Os volumes passam a **A caminho da agência**.
2. **Receber na agência:** à chegada, leia o QR de cada volume (ou escreva o código) em **Receber na agência**. O
   volume passa a **Na agência**. Quando chegam todos os volumes da encomenda, o remetente recebe o email "Pronta
   para levantar na agência".
3. **Entregar:** em **Na agência**, clique em **Entregar** (ou vá a **Entregar ao destinatário** e leia o QR do
   comprovativo, ou escreva o código `LEV-…` ou `ENC-…`).
4. **Taxas:** tarifas gerais (manuseamento e armazenagem) e direitos da Alfândega. Registe o **pagamento**. Sem tudo
   pago não há entrega.
5. **Quem levanta:**
   - **O destinatário:** nome, documento apresentado e nº; o nº do documento ou o NIF tem de coincidir com o
     registado na encomenda.
   - **Outra pessoa, com o comprovativo:** o **código do comprovativo** (`LEV-…`; vem preenchido se leu o QR do
     comprovativo), o **documento ou NIF do destinatário**, e o nome e o documento de quem levanta.
6. Clique em **Entregar**. É emitido o **comprovativo de entrega** (`ENT-…`) para imprimir e assinar. Os volumes ficam
   **Entregue** e o remetente recebe o email "Carga entregue".

**O que verificar**
- ☐ Uma encomenda pequena libertada pela Alfândega aparece em **Liberadas no porto**, com os contadores certos.
- ☐ Ler um volume que ainda não foi levantado no porto pede para registar primeiro o levantamento.
- ☐ Ler o mesmo volume duas vezes diz "já estava na agência".
- ☐ O email "Pronta para levantar na agência" só chega quando todos os volumes estão na agência.
- ☐ Não entrega com taxas por pagar.
- ☐ Um código errado é recusado: "O código não corresponde ao comprovativo desta encomenda."
- ☐ Um documento ou NIF do destinatário errado é recusado.
- ☐ O comprovativo de entrega mostra quem levantou (e se foi com o comprovativo), os volumes e o valor pago.
- ☐ A conta da Praia não vê as encomendas do Mindelo, e vice-versa.

### Etapa 11 — Viaturas: desalfandegamento pelo dono, inspeção e matrícula ✅

Como em Portugal, **quem enviou a viatura faz o desalfandegamento** no Portus, sem despachante. A **Alfândega** analisa
e liquida os direitos, o **técnico da DGTR** faz a inspeção técnica no porto e emite a matrícula. A libertação normal da
etapa 8 não serve para viaturas.

**Quem:** o dono (`cliente@portus.cv`, com conta de cliente: a viatura tem de ser de um pedido seu ou ter o seu email
como remetente), `alfandega@portus.cv` e `dgtr@portus.cv`.

1. **Dono — As minhas viaturas** (`/cliente/viaturas`): a viatura aparece quando a agência fecha a encomenda. Clique em
   **Desalfandegar** → **Começar o desalfandegamento**.
2. **Declaração:** confirme o uso da viatura (regime) e os valores de compra, transporte e seguro (em euros).
3. **Documentos** (PDF ou fotografia, até 5 MB): os que o regime exige — fatura de compra, certificado de conformidade
   (COC) ou pedido de homologação, documento de registo do país de origem, cancelamento da matrícula para exportação,
   identificação e NIF do dono, comprovativo do transporte, apólice do seguro (e a licença de táxi, ou o comprovativo de
   regresso definitivo, conforme o regime). Clique em **Submeter à Alfândega**.
4. **Alfândega — Viaturas** (`/alfandega/viaturas`): em **Por analisar**, abra a viatura, veja cada documento e
   **Aceite** ou **Recuse** (com motivo). Se faltar algo, **Pedir correções**: o dono recebe um email, troca o documento e
   submete de novo.
5. Com os documentos todos aceites e a viatura conferida no terminal (etapa 7), **Liquidar os direitos**: vazio usa o
   valor calculado pelas regras (em **Tarifas**); pode escrever outro valor e uma nota.
6. **DGTR — Inspeção e matrícula** (`/dgtr`): em **Por inspecionar**, registe a **inspeção técnica** (aprovada, ou
   reprovada com o motivo; reprovada pode repetir-se).
7. **Alfândega:** em **Por pagar**, registe o **pagamento dos direitos** com o nº do recibo (DUC).
8. **DGTR:** em **Por matricular**, escreva a **matrícula** (ex.: `ST-12-AB`) e clique em **Emitir matrícula**. A viatura
   fica libertada e nasce o **código de levantamento** `LEV-…`.
9. **Portaria** (etapa 9): procura pelo código; as taxas já não têm os direitos (pagos), só as do porto: manuseamento,
   **movimentação do contentor**, **taxa de BL**, **abertura do contentor** e armazenagem. Paga-se e entrega-se com o
   Gate Pass.

O dono recebe um email em cada passo e acompanha tudo na página da viatura (passos, documentos, direitos, histórico) e
na linha do tempo do pedido.

**O que verificar**
- ☐ Submeter sem todos os documentos mostra "Faltam documentos: …".
- ☐ Um ficheiro que não é PDF nem imagem é recusado.
- ☐ Depois de submeter, o dono já não muda nada, até a Alfândega pedir correções.
- ☐ Um documento recusado aparece ao dono com o motivo, e o email "Corrija o desalfandegamento…" chega ao Mailpit.
- ☐ A Alfândega não liquida com documentos por aceitar nem antes de a viatura ser conferida no terminal.
- ☐ A Alfândega não regista o pagamento antes da inspeção aprovada; a DGTR não emite a matrícula antes do pagamento.
- ☐ A mesma matrícula não se dá a duas viaturas.
- ☐ Na etapa 8, **Libertar** uma viatura mostra o aviso para usar **Viaturas**.
- ☐ Depois da matrícula, o dono vê a matrícula e o código de levantamento; na portaria, os direitos aparecem como pagos.

---

## 5. Administração ✅

Há dois níveis de administração:

| | Super admin (`joao@portus.cv`) | Administrador da plataforma (`governo@portus.cv`) |
|---|---|---|
| Quem é | Os donos do Portus | Quem supervisiona, ex.: um agente do Governo |
| Operações (encomendas, contentores, Alfândega…) | Vê e faz tudo, em todas as agências e portos | **Só consulta**: as ações ficam escondidas e aparece o aviso "Modo de consulta" |
| Áreas de administração | Todas | Só as do seu **perfil de administração** |
| Administradores, perfis de administração e bloqueios | ✅ | ❌ |

### Perfis de administração (`/admin/perfis`) — só super admin
Cada perfil tem um nome, uma descrição e as **permissões**: Painel geral · Registo de atividade · Problemas reportados ·
Utilizadores da equipa (sem administradores) · Agências e ligações · Tarifas e prazo de abandono · Consultar as
operações. O perfil dá-se à conta em **Utilizadores** (perfil **Administrador da plataforma** → campo **Perfil de
administração**). Mudar as permissões vale logo no pedido seguinte.
- ☐ Crie um perfil só com "Painel geral" e "Consultar as operações", dê-o a uma conta nova e entre com ela: só vê o
  painel e as operações, com o aviso "Modo de consulta" e sem botões de ação.
- ☐ Com essa conta, abrir `/admin/bloqueios` ou `/admin/users` pelo endereço leva a "sem permissão".
- ☐ Um perfil em uso não se apaga: a mensagem diz quantas contas o têm.
- ☐ Acrescente "Utilizadores" ao perfil: a conta passa a ver Utilizadores, mas não consegue criar nem alterar contas de
  administração ("Só o super admin gere contas de administração.").

### Painel geral (`/dashboard`)
Pedidos por tratar, carga por levantar (quantos volumes já pagam armazenagem e quantos estão perto do abandono),
retidos na Alfândega, cobrado no mês, volumes por estado, manifestos em atraso (72 h), navios a caminho e
encomendas dos últimos 30 dias por agência e por país.
- ☐ Os números mudam à medida que faz as etapas.

### Utilizadores (`/admin/users`)
1. **Pedidos de acesso:** quem trabalha numa agência ou no porto pede acesso em **Pedir acesso** (`/register`,
   ligação no ecrã de entrada). A conta fica em revisão e a pessoa recebe um email.
2. No separador **Pedidos de acesso**, abra a pessoa, confirme a empresa e onde trabalha, escolha a **agência**
   (agente de recolha, transitário, agência em Cabo Verde) ou o **porto** (agente marítimo, terminal, Alfândega,
   portaria) e clique em
   **Aprovar**. A pessoa recebe um email e já pode entrar.
3. **Nova conta:** cria uma conta da equipa já ativa e mostra uma **palavra-passe temporária**, só dessa vez. Entregue-a
   pessoalmente ou por telefone.
4. Numa conta: alterar o nome, o telefone, o perfil e a agência ou o porto; **Bloquear** ou **Desbloquear**;
   **Repor palavra-passe** (gera outra temporária).
- ☐ Não aprova sem a agência ou o porto do perfil.
- ☐ Uma conta bloqueada deixa de conseguir entrar.
- ☐ Depois de repor, a palavra-passe antiga deixa de funcionar.
- ☐ Não consegue bloquear a sua própria conta.
- ☐ Só o super admin vê os perfis **Administrador da plataforma** e **Super admin** ao criar uma conta; um admin não
  altera, não bloqueia nem repõe a palavra-passe de uma conta de administração.

### Agências (`/admin/agencias`)
- **Agências de envio:** país de onde envia, cidade, contactos, ilhas e tipos de carga que aceitam, se fazem recolha.
- **Agências em Cabo Verde:** cidade, morada, contactos e ilhas que servem. As contas com o perfil **Agência em Cabo
  Verde** ficam associadas a uma delas (em **Utilizadores**).
- **Ligações:** numa agência de envio, marque as agências em Cabo Verde que entregam as suas encomendas pequenas.
  Uma agência de envio pode ter várias e uma agência em Cabo Verde pode trabalhar com várias de envio.
- ☐ Uma nova agência em Cabo Verde ligada a Lisboa aparece no campo **Agência em Cabo Verde** das encomendas pequenas
  para as ilhas que serve.
- ☐ Sem ligações, as encomendas pequenas dessa agência levantam-se no porto.

### Registo de atividade (`/admin/auditoria`)
Quem fez o quê e quando. Ninguém o pode alterar ou apagar, nem o super admin. Regista quatro tipos:
- **Alteração:** cada ação das etapas (ex.: `shipment.validate`), com o **antes e o depois** de cada campo.
- **Sessão:** entradas, **entradas falhadas** (com o email tentado), contas bloqueadas a tentar entrar e saídas.
- **Consulta:** quem abriu dados pessoais ou descarregou documentos (encomenda, levantamento, Gate Pass, etiquetas,
  comprovativos, manifestos, listas de carga, fotografias, contas) e a própria exportação do registo.
- **Recusa:** acessos negados e tentativas erradas (código de levantamento, documento ou NIF, etiqueta falsa, link
  alterado, código para juntar pedidos).

Cada linha diz o perfil que a pessoa tinha na altura e o resultado (Feito, Recusado, Falhado). Clique numa linha
para ver o pedido, o **IP** e o **navegador**. Filtra por tipo, resultado, registo, perfil, pessoa, ação, IP e
datas; **Exportar CSV** descarrega o que está filtrado (abre no Excel).
- ☐ Cada ação feita nas etapas aparece aqui com o seu nome.
- ☐ Entre com uma palavra-passe errada: aparece "Entrada falhada" com o email e o IP.
- ☐ Abra uma encomenda: aparece "Abriu a encomenda" (tipo Consulta).
- ☐ O CSV exportado tem as mesmas linhas do filtro.

### Tarifas e prazo de abandono (`/admin/tarifas`)
- **Tarifas:** manuseamento por volume, armazenagem por dia e dias grátis, e as **taxas do porto só das viaturas**,
  uma vez por encomenda: movimentação do contentor (Enapor), taxa de BL e abertura do contentor.
- **Impostos de viaturas:** câmbio do euro, IVA, taxa comunitária, taxa específica do ICE (usadas até N anos) e os
  escalões do ICE por idade.
- **Regimes de viatura** (particular, táxi, emigrante, elétrico): direitos (%), isenções (ICE, taxa específica, IVA),
  cilindrada máxima, só novas, combustível exigido e os **documentos que o dono tem de enviar**.
- Os valores do seed são **de demonstração**: confirme-os com a Alfândega e atualize-os quando mudar o Orçamento do Estado.
- ☐ Mude a % de direitos do táxi: a estimativa no pedido muda logo.
- **Prazo de abandono:** dias depois da chegada do navio até a carga liberada e não levantada passar a
  **Abandonado** (60 por omissão), e quantos dias antes o remetente é avisado por email (10). A verificação corre
  de hora a hora; **Verificar agora** corre-a logo.
- ☐ Para testar sem esperar: ponha o prazo em 1 dia e o aviso em 0 com uma carga liberada cujo navio chegou há mais de um dia (o prazo conta a partir da chegada), e
  clique em **Verificar agora**. A carga passa a Abandonado e o cliente vê "Abandonada".

### Problemas reportados (`/admin/problemas`)
O que a equipa reportou com o botão **Reportar problema**: tipo, prioridade, descrição, página, navegador e captura
de ecrã. Mude o estado (Novo, Em análise, Resolvido, Não é erro) e escreva uma nota.

### Bloqueios (`/admin/bloqueios`) — só super admin
- **Processos:** parar, em toda a plataforma, os **novos pedidos de clientes**, a **validação de encomendas**, a
  **partida de navios**, a **libertação na Alfândega** ou as **entregas** (portaria e agências em Cabo Verde), com um
  aviso. Quem tentar vê o aviso; a equipa vê-o também no topo do portal. **Retomar** volta ao normal.
- **Modo de manutenção:** ninguém trabalha nem entra (nem os clientes), só o super admin.
- **Agências e portos:** suspender com motivo. As contas dessa agência ou porto deixam de trabalhar (e de entrar),
  e a agência sai de Enviar encomenda e da escolha da agência em Cabo Verde.
- O super admin nunca fica bloqueado e tudo fica no registo de atividade.
- ☐ Pare os novos pedidos: em `/enviar` o pedido não é aceite e aparece o aviso; retome e volta a funcionar.
- ☐ Ponha em manutenção: `agente@portus.cv` não consegue entrar e vê o aviso; `joao@portus.cv` entra. **Retome no fim.**
- ☐ Suspenda a agência de Lisboa: o agente vê "A sua agência está suspensa" com o motivo e a agência sai da lista de
  Enviar encomenda. **Reative no fim.**

---

## 6. Casos especiais a testar

| Regra | Como provocar | Resultado esperado |
|---|---|---|
| Duplicado (BR 9) | Duas encomendas com o mesmo nº de guia, ou o mesmo remetente, destinatário e peso no mesmo dia | Aviso "Possível encomenda duplicada"; o agente decide |
| VIN único (BR 33) | Dois veículos com o mesmo VIN, com a primeira encomenda ativa | Aviso de duplicado com a outra encomenda; o agente decide |
| Campos por tipo (BR 32) | Validar um veículo sem VIN | Lista dos campos em falta |
| ISO 6346 | Número de contentor com o último algarismo errado | Mostra o algarismo certo |
| Capacidade (BR 11) | BL Master com limite baixo e volumes pesados | Leitura bloqueada, com pedido de recontagem |
| BL obrigatório (BR 10) | Selar com um volume "sem BL Master" | Não sela e lista os volumes |
| Manifesto 72 h (BR 13) | Viagem com ETA a 2 dias, sem envio | Alerta vermelho |
| Manifesto desatualizado | Reabrir um contentor depois do envio | Alerta de nova versão |
| Fecho da conferência (BR 23) | Fechar com volumes por ler | Não fecha e lista os volumes |
| Canal vermelho (BR 15) | Registar dano ou selo violado | Sugestão "Canal vermelho" |
| Sem manifesto validado (BR 14) | Tentar despachar antes de validar | Bloqueado |
| Taxas por pagar (BR 21) | Entregar sem pagamento | Bloqueado |
| Identidade (BR 18–19) | Documento errado ou terceiro sem autorização | Recusado |
| Etiqueta falsa (BR 5) | Alterar um carácter do QR | "Etiqueta inválida" |
| Âmbito (BR 28) | Abrir pelo endereço uma encomenda de outra agência | Não encontrada |
| NIF obrigatório | Pedido, encomenda ou linha importada sem NIF do destinatário | "Indique o NIF do destinatário." |
| Juntar pedidos | Código errado em Os meus pedidos | "Código errado. Ainda pode tentar 4 vezes."; à quinta, pede um código novo |
| Cancelar tarde | Cancelar pelo link depois de "Carga recebida" | "Este pedido já não pode ser cancelado" |
| Link falsificado | Mudar uma letra do link `/pedido/…` | "Este link não é válido" |
| Aprovação sem âmbito (BR 28) | Aprovar um pedido de acesso da Alfândega sem escolher o porto | "Escolha o porto deste utilizador." |
| Abandono (BR 25) | Prazo curto e **Verificar agora** | Aviso por email uma só vez; depois Abandonado |
| Modo de consulta | Com `governo@portus.cv`, abrir uma encomenda, um contentor ou a portaria | Sem botões de ação e com o aviso "Modo de consulta"; pela API, "só permite consultar" |
| Área fora do perfil | Com `governo@portus.cv`, abrir `/admin/users` pelo endereço | Página "sem permissão" |
| Conta de administração | Admin com "Utilizadores" tenta bloquear `joao@portus.cv` | "Só o super admin gere contas de administração." |
| Processo parado | Super admin para as entregas; a portaria tenta entregar | O aviso escrito pelo super admin |
| Manutenção | Super admin põe em manutenção; outra conta tenta entrar | O aviso de manutenção; o super admin entra |
| Agência suspensa | Suspender a agência de Lisboa; `agente@portus.cv` tenta trabalhar | "A sua agência está suspensa." com o motivo |
| Encomenda pequena no porto | Procurar na portaria uma encomenda pequena com agência em Cabo Verde | "Esta encomenda é entregue pela agência em Cabo Verde, não no porto." |
| Duas agências na ilha | Ligar uma segunda agência que sirva Santiago e validar sem escolher | "Escolha a agência em Cabo Verde que entrega ao destinatário." |
| Código do comprovativo errado | Entregar a outra pessoa com `LEV-ZZZZZZ` | "O código não corresponde ao comprovativo desta encomenda." |
| Documento do destinatário errado | Entregar a outra pessoa com um documento que não é o do destinatário | "O documento do destinatário não corresponde ao registado." |
| Receber antes de levantar | Ler na agência um volume ainda **Liberado** | "Registe primeiro o levantamento no porto da encomenda ENC-…" |
| Viatura sem transporte pago | Ler a viatura no contentor sem o pagamento | "…não tem o transporte e o seguro pagos…" |
| Regime que não se aplica | Táxi com uma viatura usada | Aviso na estimativa; não deixa submeter |
| Documentos em falta | Submeter o desalfandegamento sem um documento | "Faltam documentos: …" |
| Viatura na libertação normal | **Libertar** uma viatura em Despacho aduaneiro | Aviso para usar **Viaturas** |
| Ordem dos passos | Registar o pagamento antes da inspeção, ou a matrícula antes do pagamento | "O processo está noutro passo" |

---

## 7. O que ainda não existe (não registar como erro)

Lista para não confundir uma funcionalidade em falta com um erro. Se uma destas for prioritária, anote-a como
**melhoria**.

| Área | Situação |
|---|---|
| Cliente: alterar a data da recolha | ⏳ Só cancelar; alterar fica para a próxima versão |
| Destinatário sem NIF cabo-verdiano (ex.: turista) | ⏳ Por decidir; hoje o NIF é obrigatório |
| Juntar pedidos feitos sem email | ⏳ Só se juntam os que têm o mesmo email da conta |
| Papel do exportador | ⏳ Por definir; a área do exportador está em preparação |
| Recolha: período (manhã/tarde) e data preferida | ⏳ Próxima versão, depois do feedback das partes interessadas |
| Portal do destinatário em Cabo Verde | ⏳ O destinatário recebe o código (ou o comprovativo) pelo remetente |
| Transporte entre ilhas (ex.: CV Interilhas) | ⏳ A agência regista o levantamento no porto e a receção; o transporte entre ilhas não tem etapas próprias |
| Agência em Cabo Verde para carga grande | ⏳ Veículos, mudanças e paletes levantam-se no porto |
| SMS ao destinatário | ⏳ Só há emails ao remetente |
| Emails para fora (fornecedor real) | ⏳ Em teste vão todos para o Mailpit; falta escolher o fornecedor (SES, Resend, Brevo) |
| Recolha sem internet (B7) | ⏳ O protótipo `/agent/collections` guarda só no navegador 🧪 |
| Contra-Marca e ligações eletrónicas à Alfândega e à Enapor | ⏳ |
| Relatórios exportáveis (RF-A37) | ⏳ O painel mostra os números, mas ainda não exporta |
| Obrigar a mudar a palavra-passe temporária no primeiro acesso | ⏳ |
| Pagamentos eletrónicos | ⏳ Regista-se o pagamento feito ao balcão |
| Ligação à DNRE / Sydonia World | ⏳ O dossiê fica no Portus; não há API pública para enviar a declaração |
| Consulta ao EUCARIS (registo europeu) | ⏳ Cabo Verde não é membro: confirma-se com o documento de registo e o COC |
| Viatura entregue na morada em Cabo Verde | ⏳ Levanta-se na portaria do porto |
| Valores da viatura noutras moedas (USD, GBP…) | ⏳ A declaração e a estimativa usam euros; quem envia de fora da zona euro converte o valor |
| Outros idiomas | ⏳ Só português |

---

## 8. Testes de ponta a ponta

### 8.1 Encomenda pequena (cerca de 30 minutos)

Uma única encomenda pequena, do pedido até à entrega na agência em Cabo Verde. Anote os códigos à medida que
aparecem. Para testar a portaria do porto, repita com uma **mudança** e, na linha 11, use a conta `portaria`.

| # | Conta | Ação | Anotar |
|---|---|---|---|
| 1 | Cliente (janela anónima) | `/enviar`: caixa, Portugal → Santiago, agência Morabeza (Lisboa), **recolha**; remetente **com email**; destinatário **com NIF** | `PED-…` |
| 2 | Cliente | No Mailpit (<http://localhost:8025>), abra o email e clique em **Ver ou cancelar o pedido**: **Submetido** | link |
| 3 | `agente` | **Pedidos de clientes**: **Aceitar**, depois **Agendar** para amanhã | |
| 4 | Cliente | Link do pedido: **Recolha agendada**, com a data; email do agendamento no Mailpit | |
| 5 | `agente` | **Carga recebida (criar encomenda)** | `ENC-…` |
| 6 | `agente` | Encomenda: acrescentar 2 volumes, **Validar** (agência Morabeza Praia), **Imprimir etiquetas**, **Comprovativo** | `ENC-…-01`, `-02`, `LEV-…` |
| 7 | `transitario` | **Contentores**: novo contentor `CSQU3054383` (ou outro válido), BL Master, ler os 2 códigos, **Selar e fechar** | |
| 8 | `transitario` | **Viagens**: nova viagem para a **Praia**, ETA daqui a 2 dias; associar o contentor; gerar e registar o envio do manifesto; **Registar partida** | |
| 9 | `terminal` | **Chegadas**: **Registar chegada**; abrir o contentor; localização `A-01-1`; ler os 2 códigos; **Fechar desconsolidação** | |
| 10 | `alfandega` | Validar o manifesto; **Despachar encomendas**; **Canal verde**; **Libertar** com direitos | |
| 11 | `agencia.praia` | **Liberadas no porto**: marcar e **Levantar no porto**; **Receber na agência**: os 2 códigos; **Na agência** → **Entregar**; **Registar pagamento**; **Outra pessoa, com o comprovativo**: `LEV-…`, NIF do destinatário, nome e documento; **Entregar** | `ENT-…` |
| 12 | Cliente | Link do pedido: linha do tempo completa até **Entregue**; no Mailpit, os emails de cada marco | |
| 13 | `joao` | **Registo de atividade**: as ações de 3 a 11, as entradas de cada conta e as consultas; **Painel geral**: os números mudaram | |
| 14 | `governo` | Entrar: só Painel geral, as operações e o Registo de atividade; abrir a encomenda: **Modo de consulta**, sem botões | |

### 8.2 Viatura: da morada do dono à matrícula em Cabo Verde (cerca de 45 minutos)

**O cenário:** o dono de um carro, **em qualquer país de onde envia** (Portugal, França, Holanda, Estados Unidos…),
quer mandá-lo para Cabo Verde. Uma agência desse país que **aceita viaturas e faz recolha** vai buscá-lo à **morada do
dono**, onde quer que seja, e envia-o para Cabo Verde. Lá, o próprio dono faz o **desalfandegamento** no Portus, o
técnico da **DGTR** faz a inspeção e emite a **matrícula**, e o destinatário levanta o carro na **portaria do porto**.

**Com os dados de demonstração** usa-se um exemplo concreto: o dono é a Rosa Tavares (`cliente@portus.cv`), a agência é
a **Morabeza Envios** (Portugal; tem as contas `agente` e `transitario`), a morada da recolha pode ser qualquer uma
(ex.: uma rua da Amadora) e a viagem chega à **Praia** (as contas do porto são da Praia). Para testar a partir de outro
país, escolha uma agência desse país que aceite viaturas (ex.: Kriola Cargo, Roterdão; Atlantic Bridge Shipping, EUA) e
crie em **Utilizadores** um agente e um transitário dessa agência.

**Antes de começar:** tenha 7 ficheiros PDF ou fotografias quaisquer (fazem de fatura, COC, registo, cancelamento,
identificação, comprovativo do transporte e seguro). Em **Tarifas** (`joao`) pode ver e ajustar os regimes e os impostos
de viaturas usados na estimativa.

| # | Conta | Ação | Anotar |
|---|---|---|---|
| 1 | `cliente` (o dono) | Entrar e ir a **Enviar encomenda**. **Carro, mota ou carrinha**: marca, modelo, ano `2019`, estado **Usado**, valor `7000`. Em **Uso da viatura**, escolha **Táxi**: aparece o aviso "só para viaturas novas"; mude para **Particular** e veja a **estimativa dos impostos** | estimativa |
| 2 | `cliente` | **País de onde envia** (no exemplo, Portugal) → ilha de destino (no exemplo, **Santiago**), a agência que aceita viaturas e faz recolha (no exemplo, **Morabeza Envios**), **recolha** na morada do dono (qualquer morada; ex.: uma rua da Amadora). "Quem envia" já vem com os dados da conta; destinatário com **NIF** e documento; enviar | `PED-…` |
| 3 | `agente` | **Pedidos de clientes**: **Aceitar** e **Agendar** a recolha na morada do dono | |
| 4 | `agente` | Depois de ir buscar o carro: **Carga recebida (criar encomenda)** | `ENC-…` |
| 5 | `agente` | Encomenda → **Editar dados**: VIN (17 caracteres), cilindrada `1300`, combustível, **valor do transporte** `800` e **do seguro** `150`. Acrescentar o volume (ex.: 1100 kg, 12 m³). **Validar** e **Imprimir etiquetas** | `ENC-…-01` |
| 6 | `transitario` | **Contentores**: novo contentor, BL Master **FCL**, ler o código do carro → **recusado**: "não tem o transporte e o seguro pagos" | |
| 7 | `agente` | Encomenda → **Transporte e seguro**: registar o pagamento (ex.: `950` EUR, transferência, recibo) → **Pago** | |
| 8 | `transitario` | Contentor: ler o código de novo → aceite; **Selar e fechar**. **Viagens**: nova viagem para a **Praia**; associar o contentor; gerar e registar o envio do manifesto; **Registar partida** | |
| 9 | `terminal` | **Chegadas**: **Registar chegada**; abrir o contentor; localização; ler o código do carro; **Fechar desconsolidação** | |
| 10 | `alfandega` | **Despacho aduaneiro**: **Validar** o manifesto. Em **Despachar encomendas**, o carro mostra "o dono faz o desalfandegamento" (não há **Libertar**) | |
| 11 | `cliente` | **As minhas viaturas** → **Desalfandegar** → **Começar o desalfandegamento**. Confirme o uso e os valores; **Submeter** sem documentos → "Faltam documentos"; envie os 7 documentos; **Submeter à Alfândega** | |
| 12 | `alfandega` | **Viaturas** → **Por analisar**: abra o carro e veja os documentos; **Recusar** um (ex.: o COC, "ilegível") e **Pedir correções** | |
| 13 | `cliente` | A página mostra o motivo; no Mailpit, o email "Corrija o desalfandegamento…". Retire o documento recusado, envie outro e **Submeta** de novo | |
| 14 | `alfandega` | **Aceitar** os documentos; **Liquidar os direitos** (vazio = valor calculado) | direitos (CVE) |
| 15 | `dgtr` | **Inspeção e matrícula** → **Por inspecionar**: registe a inspeção **Aprovada** (para testar, primeiro **Reprovada** com o motivo) | |
| 16 | `alfandega` | **Viaturas** → **Por pagar**: **Registar pagamento** com o nº do recibo | `DUC-…` |
| 17 | `dgtr` | **Por matricular**: escreva a matrícula (ex.: `ST-12-AB`) e **Emitir matrícula** | matrícula, `LEV-…` |
| 18 | `cliente` | Página da viatura: **matrícula** e **código de levantamento**. **Os meus pedidos**: a linha do tempo tem direitos liquidados, inspeção, pagamento e matrícula. No Mailpit, um email por passo | |
| 19 | `portaria` | **Levantamentos**: procurar o `LEV-…`. Os direitos aparecem pagos; ficam só as taxas do porto (manuseamento, movimentação do contentor, BL, abertura do contentor). **Registar pagamento**; documento do destinatário; ler o código do carro; código `LEV-…`; **Entregar** | `GP-…` |
| 20 | `joao` | **Registo de atividade**: filtre a ação `vehicle_clearance` para ver todos os passos, quem os fez e quando | |

**O que verificar no fim**
- ☐ A estimativa do passo 1 e os direitos liquidados no passo 14 batem certo (sem ajuste da Alfândega).
- ☐ O carro não entrou no contentor antes de o transporte e o seguro estarem pagos (passo 6).
- ☐ Cada passo só foi possível na ordem certa: inspeção → pagamento → matrícula.
- ☐ Na portaria, o total é só o das taxas do porto: os direitos já estavam pagos.
- ☐ O dono recebeu os emails: submetido, correções, direitos liquidados, inspeção, pagamento e matrícula.

---

## 9. Registo de problemas

**No portal:** clique em **Reportar problema** no cabeçalho, na página onde aconteceu. Escolha o tipo, a prioridade,
descreva o que fez, o que aconteceu e o que esperava e, se ajudar, junte uma captura de ecrã. A página e o navegador
ficam registados sozinhos. O administrador vê tudo em **Problemas reportados**.

**Em papel:** se preferir, use esta tabela. Em **Tipo**, use:
- **Erro**: não funciona como descrito.
- **Falta**: devia existir e não existe.
- **Melhoria**: funciona, mas pode ficar mais fácil ou mais claro.

| # | Etapa | Perfil | Tipo | O que fiz | O que aconteceu | O que esperava | Prioridade |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |

---

## 10. Glossário

| Termo | O que é |
|---|---|
| **Pedido** (`PED-…`) | O que o cliente faz em `/enviar`. Passa a encomenda quando a agência recebe a carga. |
| **Encomenda** (`ENC-…`) | A carga de um remetente para um destinatário, registada pela agência. Tem um ou mais volumes. |
| **Volume** (`ENC-…-01`) | Cada caixa, veículo ou palete, com a sua etiqueta QR. É o volume que avança de estado. |
| **Etiqueta QR** | Etiqueta colada em cada volume. O QR é assinado: uma etiqueta falsificada ou desatualizada é recusada. |
| **Contentor** | Caixa metálica de transporte. O número segue a norma **ISO 6346** (4 letras, 6 algarismos e um de controlo). |
| **BL Master** | Documento de transporte que agrupa as encomendas de várias pessoas num contentor. |
| **LCL / FCL** | Grupagem (vários clientes no mesmo contentor) / contentor completo de um só cliente. |
| **Selo** | Lacre numerado que fecha o contentor; é conferido à chegada. |
| **ETD / ETA** | Partida prevista / chegada prevista do navio. |
| **Manifesto** | Lista oficial da carga de uma viagem, enviada à Alfândega e à Enapor pelo menos 72 horas antes da chegada. |
| **Desconsolidação** | Abrir o contentor no porto e conferir cada volume. |
| **Ocorrência** | Problema registado na conferência: falta, dano, selo violado ou excesso. |
| **Canal verde / vermelho** | Decisão da Alfândega: libertar sem inspeção / inspecionar fisicamente. |
| **Código de levantamento** (`LEV-…`) | Código para levantar a carga. Nas encomendas pequenas nasce ao validar e está no comprovativo de envio; nas outras é dado ao libertar a carga. |
| **Comprovativo de envio** | Papel entregue ao remetente ao fechar a caixa (e enviado por email), com a agência em Cabo Verde, o código de levantamento e um QR. Quem o traz, com o documento do destinatário, pode levantar. |
| **Agência em Cabo Verde** | Agência ligada à agência de envio que despacha, leva para as suas instalações e entrega as encomendas pequenas. |
| **Gate Pass** (`GP-…`) | Comprovativo de saída da carga do porto, emitido na entrega. |
| **Comprovativo de entrega** (`ENT-…`) | Emitido pela agência em Cabo Verde na entrega, com quem levantou e os volumes. |
| **Abandonado** | Carga liberada que não foi levantada dentro do prazo (BR 25). |
| **Mailpit** | Caixa de correio de testes onde ficam os emails da plataforma enquanto não há um fornecedor real. |
| **Super admin** | Os donos do Portus: fazem tudo, incluindo gerir administradores, perfis de administração e bloqueios. |
| **Administrador da plataforma** | Quem supervisiona (ex.: Governo): usa só as áreas do seu perfil de administração e só consulta as operações. |
| **Perfil de administração** | Conjunto de permissões criado pelo super admin e dado a cada administrador da plataforma. |
| **Registo de atividade** | Registo imutável de quem fez o quê e quando: alterações, sessões, consultas e recusas. |
| **Modo de manutenção** | Bloqueio do super admin em que só ele trabalha e entra na plataforma. |
| **Desalfandegamento pelo dono** | O dono da viatura declara-a e envia os documentos no Portus; a Alfândega liquida os direitos. |
| **Regime de viatura** | Uso da viatura em Cabo Verde (particular, táxi, emigrante, elétrico), com direitos e isenções próprios. |
| **COC** | Certificado de conformidade do fabricante; sem ele, faz-se um pedido de homologação. |
| **DUC** | Recibo do pagamento dos direitos na Alfândega. |
| **DGTR** | Direção-Geral dos Transportes Rodoviários: inspeção técnica e matrícula das viaturas. |
| **BR / RF** | Regras de negócio / requisitos funcionais do documento de requisitos (ex.: BR 25, RF-A36). |
