# Manual de utilização e testes do Portus

Este manual explica como usar o Portus do princípio ao fim: desde o pedido do cliente num país de envio até ao
levantamento da carga em Cabo Verde. Segue a ordem real do processo e, em cada etapa, diz **quem** faz, **onde**,
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
4. [Etapas em Cabo Verde](#4-etapas-em-cabo-verde): chegada, Alfândega, levantamento
5. [Administração](#5-administração-): painel, utilizadores, auditoria, tarifas, problemas reportados
6. [Casos especiais a testar](#6-casos-especiais-a-testar)
7. [O que ainda não existe](#7-o-que-ainda-não-existe-não-registar-como-erro)
8. [Teste de ponta a ponta](#8-teste-de-ponta-a-ponta-cerca-de-30-minutos)
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

Todas usam a palavra-passe `PortusDemo!2026-CV`. As contas de Cabo Verde estão no **porto da Praia**.

| Conta | Perfil | Onde trabalha | Página inicial |
|---|---|---|---|
| *(sem conta)* | Cliente | — | `/enviar`, `/acompanhar` |
| `agente@portus.cv` | Agente de recolha | Agência Morabeza Envios, Lisboa | Recolhas |
| `transitario@portus.cv` | Transitário | Agência Morabeza Envios, Lisboa | Viagens e manifestos |
| `carla@portus.cv` | Agente marítimo | Porto da Praia | Chegadas |
| `terminal@portus.cv` | Operador do terminal | Porto da Praia | Chegadas e conferência |
| `alfandega@portus.cv` | Alfândega | Porto da Praia | Despacho aduaneiro |
| `portaria@portus.cv` | Portaria | Porto da Praia | Levantamentos |
| `joao@portus.cv` | Administrador | Todas as agências e portos | Utilizadores |
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
- **Preencha o NIF ou o documento do destinatário.** Sem um deles, a Alfândega sugere canal vermelho e a portaria
  não consegue entregar a carga (ver a etapa 9).
- **A viagem tem de chegar à Praia** (`CVRAI`), porque as contas de Cabo Verde só veem esse porto.
- **Use emails inventados** nos pedidos (ex.: `rosa@teste.pt`). Os emails vão todos para o Mailpit
  (<http://localhost:8025>); ninguém os recebe de verdade.

---

## 2. Visão geral do processo

```
 PAÍS DE ENVIO                                                     CABO VERDE
 ─────────────────────────────────────────────────                 ───────────────────────────────────────
 1 Cliente      2 Agência        3-4 Agente/Agência   5-6 Transitário    7 Terminal     8 Alfândega   9 Portaria
 faz pedido  →  aceita/agenda →  recebe, valida,   →  contentor,     →  chegada,    →  manifesto, →  taxas,
                                 etiqueta             viagem,           conferência    canal,        entrega,
                                                      manifesto,        por QR         libertação    Gate Pass
                                                      partida
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
| 9 | Taxas e levantamento | Portaria | **Entregue** | ✅ |
| — | Carga não levantada no prazo | Automático (prazo nas Tarifas) | **Abandonado** | ✅ |
| — | Acompanhamento e emails | Cliente | — | ✅ até à entrega |
| — | Administração | Administrador | — | ✅ |

> **Agência e agente de recolha.** A agência não tem uma conta própria. Quem trabalha nela entra como **agente
> de recolha** e trata os pedidos e as encomendas da agência. O **transitário** é da mesma agência e trata do
> contentor e da viagem. O **administrador** pode fazer tudo, em todas as agências.

### Menus de cada perfil

Cada conta vê só o que lhe diz respeito. Toda a equipa tem também o botão **Reportar problema** no cabeçalho.

| Perfil | Menus |
|---|---|
| Cliente (com conta) | Os meus pedidos |
| Agente de recolha | Recolhas 🧪 · Nova recolha 🧪 · Pedidos de clientes · Encomendas · Importar lista |
| Transitário | Viagens e manifestos · Contentores · Encomendas · Importar lista |
| Agente marítimo | Chegadas |
| Operador do terminal | Chegadas e conferência |
| Alfândega | Despacho aduaneiro |
| Portaria | Levantamentos |
| Administrador | Painel geral · Utilizadores · Pedidos de clientes · Encomendas · Importar lista · Contentores · Viagens e manifestos · Chegadas e conferência · Despacho aduaneiro · Levantamentos · Tarifas · Auditoria · Problemas reportados |
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
   Preencha o **NIF do destinatário**.
4. **Confirmar:** reveja tudo. Se quiser, crie uma conta (opcional) e envie.

No fim aparece o **código do pedido** (ex.: `PED-7KQ2M9`), com um botão para o copiar, e o **link do seu pedido**.
Com email indicado, chega também um email com o código e o botão **Ver ou cancelar o pedido**.

**O que verificar**
- ☐ O país vem preenchido com o país onde está e pode ser mudado.
- ☐ A lista de agências muda conforme o país, a carga e a ilha.
- ☐ A opção de recolha só aparece nas agências que a fazem.
- ☐ Os campos obrigatórios mostram erro se ficarem vazios.
- ☐ Recebe o código `PED-…` no fim.
- ☐ O email "Pedido PED-… recebido" chega ao Mailpit e o botão abre o pedido (`/pedido/…`).
- ☐ Com conta criada, o pedido aparece em **Os meus pedidos** (`/cliente`).

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
2. Preencha a carga, o remetente, o destinatário (com NIF ou documento) e os volumes.

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
6. Leve os volumes para o armazém da agência. Ficam à espera de contentor.

Uma encomenda, em rascunho ou já validada, pode ser **cancelada** com motivo.

**O que verificar**
- ☐ Validar sem volumes ou sem um campo obrigatório mostra exatamente o que falta.
- ☐ O aviso de duplicado aparece (também para um VIN repetido) e deixa continuar.
- ☐ As etiquetas imprimem uma por volume, com o código `ENC-…-01`, `-02`…
- ☐ Depois de validada, a encomenda já não se edita.

### Acompanhamento pelo cliente ✅ (em qualquer momento)

O cliente acompanha o pedido de três formas:
- **Link do email** (`/pedido/…`): sem conta e sem escrever nada.
- **Acompanhar pedido** (`/acompanhar`): com o código do pedido e o telefone do remetente.
- **Os meus pedidos** (`/cliente`): com conta.

**Antes de a agência receber a carga**, vê o estado (**Submetido → Aceite → Recolha agendada**), a data marcada e as
notas da agência, e pode **cancelar o pedido** (com motivo opcional). Recebe um email a confirmar.

**Depois de "Carga recebida"**, vê a **linha do tempo da encomenda**: recebida na agência → etiquetada → no
contentor → em viagem (navio e chegada prevista) → chegou a Cabo Verde → pronta para levantar → entregue. Quando a
carga está pronta, aparece o **código de levantamento** `LEV-…` (para passar ao destinatário), o porto e as taxas
a pagar nesse dia. Também recebe um email em cada marco: em viagem, chegou, pronta para levantar e entregue.

**O que verificar**
- ☐ Com o telefone errado, o pedido não aparece. Um link alterado mostra "Este link não é válido".
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
   **Liberado** e aparece o **código de levantamento** (`LEV-…`).
5. O remetente recebe por email o código e as taxas, e vê-os na linha do tempo. Ao destinatário, por agora, o código
   chega pelo remetente ou à mão (⏳ o SMS ainda não existe).

**O que verificar**
- ☐ Não liberta nada antes de validar o manifesto.
- ☐ A sugestão de canal muda com as ocorrências registadas na etapa 7.
- ☐ Uma encomenda retida pode ser libertada depois.
- ☐ O código `LEV-…` aparece depois de libertar e chega ao remetente no email "Carga pronta para levantar".

### Etapa 9 — Portaria: taxas e levantamento ✅

**Quem:** `portaria@portus.cv`.
**Onde:** **Levantamentos** (`/portaria`).

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
- ☐ Um destinatário **sem NIF e sem documento** registados não consegue levantar. Confirme se é isto que se
  pretende.
- ☐ Na entrega, o remetente recebe o email "Carga entregue" e a linha do tempo fica completa.

---

## 5. Administração ✅

**Quem:** `joao@portus.cv`. Tem todos os menus das etapas, em todas as agências e portos, e ainda:

### Painel geral (`/dashboard`)
Pedidos por tratar, carga por levantar (quantos volumes já pagam armazenagem e quantos estão perto do abandono),
retidos na Alfândega, cobrado no mês, volumes por estado, manifestos em atraso (72 h), navios a caminho e
encomendas dos últimos 30 dias por agência e por país.
- ☐ Os números mudam à medida que faz as etapas.

### Utilizadores (`/admin/users`)
1. **Pedidos de acesso:** quem trabalha numa agência ou no porto pede acesso em **Pedir acesso** (`/register`,
   ligação no ecrã de entrada). A conta fica em revisão e a pessoa recebe um email.
2. No separador **Pedidos de acesso**, abra a pessoa, confirme a empresa e onde trabalha, escolha a **agência**
   (agente de recolha, transitário) ou o **porto** (agente marítimo, terminal, Alfândega, portaria) e clique em
   **Aprovar**. A pessoa recebe um email e já pode entrar.
3. **Nova conta:** cria uma conta da equipa já ativa e mostra uma **palavra-passe temporária**, só dessa vez. Entregue-a
   pessoalmente ou por telefone.
4. Numa conta: alterar o nome, o telefone, o perfil e a agência ou o porto; **Bloquear** ou **Desbloquear**;
   **Repor palavra-passe** (gera outra temporária).
- ☐ Não aprova sem a agência ou o porto do perfil.
- ☐ Uma conta bloqueada deixa de conseguir entrar.
- ☐ Depois de repor, a palavra-passe antiga deixa de funcionar.
- ☐ Não consegue bloquear a sua própria conta.

### Auditoria (`/admin/auditoria`)
Todas as alterações, de todos os perfis: quem, quando, a ação e o registo. Clique numa linha para ver o **antes e o
depois** de cada campo. Filtra por tipo de registo, ação (ex.: `shipment.validate`), pessoa e dias.
- ☐ Cada ação feita nas etapas aparece aqui com o seu nome.

### Tarifas e prazo de abandono (`/admin/tarifas`)
- **Tarifas:** manuseamento por volume, armazenagem por dia e dias grátis.
- **Prazo de abandono:** dias depois da chegada do navio até a carga liberada e não levantada passar a
  **Abandonado** (60 por omissão), e quantos dias antes o remetente é avisado por email (10). A verificação corre
  de hora a hora; **Verificar agora** corre-a logo.
- ☐ Para testar sem esperar: ponha o prazo em 1 dia e o aviso em 0 com uma carga liberada cujo navio chegou há mais de um dia (o prazo conta a partir da chegada), e
  clique em **Verificar agora**. A carga passa a Abandonado e o cliente vê "Abandonada".

### Problemas reportados (`/admin/problemas`)
O que a equipa reportou com o botão **Reportar problema**: tipo, prioridade, descrição, página, navegador e captura
de ecrã. Mude o estado (Novo, Em análise, Resolvido, Não é erro) e escreva uma nota.

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
| Cancelar tarde | Cancelar pelo link depois de "Carga recebida" | "Este pedido já não pode ser cancelado" |
| Link falsificado | Mudar uma letra do link `/pedido/…` | "Este link não é válido" |
| Aprovação sem âmbito (BR 28) | Aprovar um pedido de acesso da Alfândega sem escolher o porto | "Escolha o porto deste utilizador." |
| Abandono (BR 25) | Prazo curto e **Verificar agora** | Aviso por email uma só vez; depois Abandonado |

---

## 7. O que ainda não existe (não registar como erro)

Lista para não confundir uma funcionalidade em falta com um erro. Se uma destas for prioritária, anote-a como
**melhoria**.

| Área | Situação |
|---|---|
| Cliente: alterar a data da recolha | ⏳ Só cancelar; alterar fica para a próxima versão |
| Recolha: período (manhã/tarde) e data preferida | ⏳ Próxima versão, depois do feedback das partes interessadas |
| Portal do destinatário em Cabo Verde | ⏳ O destinatário recebe o código pelo remetente |
| SMS ao destinatário | ⏳ Só há emails ao remetente |
| Emails para fora (fornecedor real) | ⏳ Em teste vão todos para o Mailpit; falta escolher o fornecedor (SES, Resend, Brevo) |
| Recolha sem internet (B7) | ⏳ O protótipo `/agent/collections` guarda só no navegador 🧪 |
| Contra-Marca e ligações eletrónicas à Alfândega e à Enapor | ⏳ |
| Relatórios exportáveis (RF-A37) | ⏳ O painel mostra os números, mas ainda não exporta |
| Área do exportador | ⏳ Os ecrãs de demonstração foram retirados |
| Obrigar a mudar a palavra-passe temporária no primeiro acesso | ⏳ |
| Pagamentos eletrónicos | ⏳ Regista-se o pagamento feito ao balcão |
| Outros idiomas | ⏳ Só português |

---

## 8. Teste de ponta a ponta (cerca de 30 minutos)

Uma única encomenda do pedido até ao Gate Pass. Anote os códigos à medida que aparecem.

| # | Conta | Ação | Anotar |
|---|---|---|---|
| 1 | Cliente (janela anónima) | `/enviar`: caixa, Portugal → Santiago, agência Morabeza (Lisboa), **recolha**; remetente **com email**; destinatário **com NIF** | `PED-…` |
| 2 | Cliente | No Mailpit (<http://localhost:8025>), abra o email e clique em **Ver ou cancelar o pedido**: **Submetido** | link |
| 3 | `agente` | **Pedidos de clientes**: **Aceitar**, depois **Agendar** para amanhã | |
| 4 | Cliente | Link do pedido: **Recolha agendada**, com a data; email do agendamento no Mailpit | |
| 5 | `agente` | **Carga recebida (criar encomenda)** | `ENC-…` |
| 6 | `agente` | Encomenda: acrescentar 2 volumes, **Validar**, **Imprimir etiquetas** | `ENC-…-01`, `-02` |
| 7 | `transitario` | **Contentores**: novo contentor `CSQU3054383` (ou outro válido), BL Master, ler os 2 códigos, **Selar e fechar** | |
| 8 | `transitario` | **Viagens**: nova viagem para a **Praia**, ETA daqui a 2 dias; associar o contentor; gerar e registar o envio do manifesto; **Registar partida** | |
| 9 | `terminal` | **Chegadas**: **Registar chegada**; abrir o contentor; localização `A-01-1`; ler os 2 códigos; **Fechar desconsolidação** | |
| 10 | `alfandega` | Validar o manifesto; **Despachar encomendas**; **Canal verde**; **Libertar** com direitos | `LEV-…` |
| 11 | `portaria` | Procurar o `LEV-…`; **Registar pagamento**; NIF do destinatário; ler os 2 códigos; código `LEV-…`; **Entregar** | `GP-…` |
| 12 | Cliente | Link do pedido: linha do tempo completa até **Entregue**; no Mailpit, os emails de cada marco | |
| 13 | `joao` | **Auditoria**: as ações de 3 a 11; **Painel geral**: os números mudaram | |

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
| **Código de levantamento** (`LEV-…`) | Código dado ao libertar a carga; o destinatário apresenta-o na portaria. |
| **Gate Pass** (`GP-…`) | Comprovativo de saída da carga do porto, emitido na entrega. |
| **Abandonado** | Carga liberada que não foi levantada dentro do prazo (BR 25). |
| **Mailpit** | Caixa de correio de testes onde ficam os emails da plataforma enquanto não há um fornecedor real. |
| **BR / RF** | Regras de negócio / requisitos funcionais do documento de requisitos (ex.: BR 25, RF-A36). |
