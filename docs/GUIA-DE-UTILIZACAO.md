# Guia de utilização do Portus

Passo a passo de uma encomenda, desde o pedido do cliente até ao levantamento em Cabo Verde, e o que cada
perfil faz em cada passo.

Legenda:

- ✅ **Funciona**: os dados são guardados no servidor e pode testar de ponta a ponta.
- 🧪 **Demonstração**: o ecrã existe, mas mostra dados fictícios e não guarda nada.
- ⏳ **Por construir**: ainda não existe na plataforma.

## Antes de começar

1. Arranque o backend (`npm run dev` em `portus_service`) e o portal (`npm run dev` em `portus`).
2. Abra o portal em `http://localhost:3000`.
3. Contas de demonstração (palavra-passe `PortusDemo!2026-CV`):

| Conta | Perfil | Notas |
|---|---|---|
| `agente@portus.cv` | Agente de recolha | Agência Morabeza Envios, Lisboa |
| `joao@portus.cv` | Administrador | Vê todas as agências |
| `ana@portus.cv` | Exportador | Ecrãs de demonstração |
| `carla@portus.cv` | Agente marítimo | Porto da Praia; ecrãs de demonstração |
| `bruno@portus.cv` | Transitário | Conta em revisão: não consegue entrar |
| `duarte@portus.cv` | Operador CV | Conta bloqueada: não consegue entrar |

O cliente não precisa de conta. Se quiser uma, cria-a no último passo do pedido (**Quer criar conta?**). As
empresas (exportador, transitário, agente marítimo, operador CV) pedem acesso em **Pedir acesso**
(`/register`) e a conta fica em revisão até ser aprovada.

> **Agência e agente de recolha.** Na plataforma, a agência não tem uma conta própria. Quem trabalha na agência
> entra como **agente de recolha** e trata os pedidos e as encomendas dessa agência. O administrador pode fazer o
> mesmo em todas as agências.

## Visão geral

```
1. Cliente faz o pedido                    ✅
2. Agência aceita e agenda a recolha        ✅
3. Agente recolhe a carga → encomenda       ✅
4. Agente valida e cola as etiquetas QR     ✅
   ─────────── a parte que funciona termina aqui ───────────
5. Consolidação no contentor (BL Master)    🧪 / ⏳
6. Viagem e manifesto                       🧪 / ⏳
7. Chegada e desconsolidação em Cabo Verde  🧪 / ⏳
8. Alfândega, taxas e pagamento             ⏳
9. Levantamento com Gate Pass               🧪 / ⏳
```

Os estados de cada volume ao longo do percurso são: **Rascunho → Recolhido → Consolidado → Embarcado → Chegado →
Desconsolidado → Liberado (ou Retido) → Entregue**.

---

## 1. Cliente: fazer o pedido ✅

**Quem:** o cliente (remetente), com ou sem conta.
**Onde:** botão **Enviar encomenda** na página inicial (`/enviar`).

O assistente tem quatro passos:

1. **O que vai enviar:** tipo de carga (encomendas pequenas, veículos, paletes…), descrição e os dados que esse
   tipo pede.
2. **Destino e agência:**
   - país de onde envia (vem preenchido conforme a localização);
   - ilha de destino;
   - agência;
   - entrega da carga: **recolha** na morada do cliente ou **entrega na agência**.
3. **Contactos:** remetente e destinatário.
4. **Confirmar:** revê tudo, escolhe se quer criar conta (opcional) e envia.

No fim recebe um **código do pedido** (ex.: `PED-7KQ2M9`). Deve guardá-lo.

**Resultado:** o pedido fica **Submetido** e aparece na fila da agência.

## 2. Agência: tratar o pedido ✅

**Quem:** agente de recolha (ou administrador).
**Onde:** menu **Pedidos de clientes** (`/agencia/pedidos`).

A fila tem três separadores: **Por tratar**, **Em curso** e **Fechados**. Para cada pedido:

| Ação | Quando | Estado seguinte |
|---|---|---|
| **Aceitar** (com nota opcional para o cliente) | Pedido submetido | Aceite |
| **Recusar** (motivo obrigatório) | Pedido submetido | Recusado |
| **Agendar**: data e hora da recolha, ou da entrega na agência | Pedido aceite | Recolha agendada |
| **Cancelar** (motivo obrigatório) | Aceite ou agendado | Cancelado |

O cliente vê o estado, a data marcada e as notas da agência (ver o passo 5 do cliente, mais abaixo).

## 3. Agente de recolha: receber a carga ✅

**Quem:** agente de recolha.

Há dois caminhos, conforme a origem da carga.

**A. A carga vem de um pedido de cliente**
1. Em **Pedidos de clientes**, abra o pedido aceite ou agendado.
2. Depois de ir buscar a carga (ou de o cliente a entregar no balcão), clique em
   **Carga recebida (criar encomenda)**.
3. O pedido passa a **Carga recebida** e é criada uma **encomenda em rascunho** (ex.: `ENC-88CYMC`), já com os
   dados do cliente.

**B. O cliente aparece no balcão sem pedido**
1. Menu **Encomendas** → **Nova encomenda** (`/agencia/encomendas/nova`).
2. Preencha o tipo de carga, o remetente, o destinatário e os volumes.

> O menu **Recolhas / Nova recolha** (`/agent/collections`) é um protótipo para trabalhar sem internet. Guarda
> só no navegador e não envia nada ao servidor. Para o fluxo real, use **Pedidos de clientes** e
> **Encomendas**.

## 4. Agente de recolha: fechar a encomenda ✅

**Onde:** **Encomendas** (`/agencia/encomendas`) → abrir a encomenda.

1. **Confira e complete os dados** com **Editar dados**. Os campos obrigatórios dependem do tipo de carga: um
   veículo, por exemplo, precisa do VIN, da marca, do modelo e do ano.
2. **Registe os volumes:** uma linha por caixa, veículo ou palete, com o peso e as medidas (ou o volume em m³).
3. Clique em **Validar**.
   - Se faltar algum dado, a plataforma diz o quê.
   - Se encontrar uma **possível encomenda duplicada** (mesmo nº de guia, ou mesmo remetente, destinatário e peso
     no mesmo dia), mostra-a. O agente decide se continua.
4. Ao validar, a encomenda fica **Validada** e cada volume fica **Recolhido**.
5. Clique em **Imprimir etiquetas** e cole uma etiqueta em cada volume. O QR de cada etiqueta é assinado e
   identifica o volume até ao levantamento.
6. Leve os volumes etiquetados para o armazém da agência, onde ficam à espera de contentor.

Uma encomenda, em rascunho ou já validada, pode ser **cancelada**, com motivo.

> **É aqui que termina hoje a parte que funciona.** Os passos seguintes ainda não existem no servidor (o
> próximo a construir é a consolidação, a fase B5 do roadmap).

## 5. Cliente: acompanhar o pedido ✅

O cliente pode acompanhar o pedido de duas formas:

- **Sem conta:** **Acompanhar pedido** (`/acompanhar`), com o código do pedido e o telefone do remetente.
- **Com conta:** **Os meus pedidos** (`/cliente`).

Vê o estado (**Submetido → Aceite → Recolha agendada → Carga recebida**), a data marcada e as notas da agência.

⏳ Depois de **Carga recebida**, o cliente ainda não vê a encomenda nem os volumes a avançar.

---

## 6. Transitário / exportador: consolidar no contentor 🧪 ⏳

**Quem:** transitário ou exportador.
**Onde (demonstração):** **Contentores**, **BL**, **Embarques** e **Volumes** (`/exporter/...`).

O que vai acontecer:

1. Criar o **contentor**; o número é validado pela norma ISO 6346.
2. Criar o **BL Master**. As encomendas pequenas de várias pessoas ficam sob o mesmo BL Master.
3. Ler o QR de cada volume para o associar ao contentor. O volume passa a **Consolidado**.
4. A plataforma **bloqueia** se o peso ou o volume total ultrapassar a capacidade do contentor.
5. Registar o **selo** e **fechar** o contentor. Não fecha se ficarem volumes no armazém sem BL.

## 7. Transitário / agente marítimo: viagem e manifesto 🧪 ⏳

**Onde (demonstração):** **Manifestos** (`/exporter/manifestos`) e **Navios** (`/cv/navios`).

1. Criar a **viagem** (navio, portos, ETA) e associar os contentores.
2. Gerar o **manifesto** (`.xlsx`, `.pdf`, `.csv`) e enviá-lo à Alfândega e à Enapor **pelo menos 72 horas
   antes da chegada**. A plataforma avisa quando o prazo se aproxima.
3. Quando o navio parte, os volumes passam a **Embarcado**.

## 8. Cabo Verde: chegada e desconsolidação 🧪 ⏳

**Quem:** agente marítimo e operador CV.
**Onde (demonstração):** **Navios**, **Contra-Marca** e **Conferência** (`/cv/...`).

1. Registar a **chegada** do navio e a descarga do contentor. Os volumes passam a **Chegado**.
2. Registar a **Contra-Marca** e cruzá-la com a descarga.
3. Abrir o contentor e **conferir** cada volume, lendo o QR. Registar ocorrências (falta, dano, selo violado,
   excesso), com fotografias.
4. O contentor só fica **Desconsolidado** quando todos os volumes estiverem conferidos ou tiverem ocorrência.
5. Indicar onde fica cada volume no armazém.

## 9. Alfândega, pagamento e levantamento 🧪 ⏳

**Quem:** operador CV, com o destinatário.
**Onde (demonstração):** **Gate Pass** (`/cv/gate-pass`).

1. **Despacho:** a Alfândega atribui o canal. Com canal verde, o volume fica **Liberado**. Com canal vermelho,
   documentação em falta ou taxa por pagar, fica **Retido**.
2. **Taxas e pagamento.**
3. **Levantamento:** o destinatário identifica-se e é emitido o **Gate Pass**. O volume fica **Entregue**.
4. Se o prazo de armazenagem for ultrapassado, o volume fica **Abandonado**.

---

## Resumo por perfil

| Perfil | O que faz | Estado |
|---|---|---|
| **Cliente** | Faz o pedido, guarda o código e acompanha | ✅ |
| **Agente de recolha (agência)** | Aceita, recusa e agenda pedidos; recebe a carga; cria, completa e valida encomendas; imprime etiquetas | ✅ |
| **Administrador** | O mesmo que a agência, em todas as agências; gere utilizadores | ✅ agência · 🧪 utilizadores |
| **Transitário / exportador** | Contentor, BL Master, consolidação, selo, viagem, manifesto | 🧪 / ⏳ |
| **Agente marítimo** | Navios, chegada, conferência, Gate Pass | 🧪 / ⏳ |
| **Operador CV** | Contra-Marca, Gate Pass, auditoria | 🧪 / ⏳ |
| **Destinatário** | Levanta a carga em Cabo Verde | ⏳ |

## Teste rápido de ponta a ponta (o que funciona hoje)

1. **Cliente:** em `/enviar`, faça um pedido com **recolha** e anote o código `PED-…`.
2. **Cliente:** em `/acompanhar`, confirme que o pedido aparece como **Submetido**.
3. **Agência:** entre com `agente@portus.cv`, abra **Pedidos de clientes** e clique em **Aceitar** e depois em
   **Agendar**.
4. **Cliente:** volte a `/acompanhar`. O pedido aparece como **Recolha agendada**, com a data.
5. **Agente:** no pedido, clique em **Carga recebida (criar encomenda)**.
6. **Agente:** em **Encomendas**, abra a nova encomenda, complete os dados e os volumes e clique em **Validar**.
7. **Agente:** clique em **Imprimir etiquetas**.
8. **Fim do que funciona hoje.** A seguir viria a consolidação no contentor.
