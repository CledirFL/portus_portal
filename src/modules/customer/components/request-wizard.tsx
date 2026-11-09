"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { Check, CheckCircle2, Copy, MapPin, Truck, Store as StoreIcon, CalendarDays } from "lucide-react";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, fieldClasses, fieldErrorClasses } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { agenciesFor, servedCountryCodes, type Agency } from "@/domain/agency";
import { getDispatchCountry, dispatchCountries, guessDispatchCountry, readBrowserLocation } from "@/domain/countries";
import { cargoTypes, fieldValueLabel, getCargoType, missingPublicFields } from "@/domain/cargo-types";
import { VehicleEstimate } from "@/modules/shipments/components/vehicle-estimate";
import {
  caboVerdeIslands,
  shipmentRequestSchema,
  type ShipmentRequest,
  type ShipmentRequestInput,
} from "@/domain/shipment-request";
import { ApiError } from "@/lib/api-client";
import { useHydrated } from "@/lib/use-hydrated";
import { fetchAgencies } from "@/services/api/agencies";
import { registerCustomer } from "@/services/api/auth";
import { submitShipmentRequest } from "@/services/api/shipment-requests";
import { useAuthStore } from "@/store/auth-store";

const steps = ["O que vai enviar", "Destino e agência", "Contactos", "Confirmar"] as const;

const defaultValues: ShipmentRequestInput = {
  dispatchCountry: "",
  agencyId: "",
  category: "encomenda_pequena",
  description: "",
  details: {},
  handover: "entrega_na_agencia",
  pickupAddress: "",
  sender: { name: "", phone: "", email: "" },
  recipient: { name: "", phone: "+238 ", island: "Santiago", nif: "" },
};

// Nomes legíveis para erros devolvidos pela API sobre campos de outros passos.
const fieldNames: Record<string, string> = {
  agencyId: "Agência",
  handover: "Entrega da carga",
  dispatchCountry: "País de onde envia",
  "recipient.island": "Ilha de destino",
  "recipient.phone": "Telefone do destinatário",
  "sender.phone": "O seu telefone",
};

const stepFields: Array<FieldPath<ShipmentRequestInput>[]> = [
  ["category", "description"],
  ["dispatchCountry", "recipient.island", "agencyId", "handover"],
  ["sender.name", "sender.phone", "sender.email", "recipient.name", "recipient.phone", "recipient.nif"],
];

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("pt-PT", { day: "numeric", month: "long" }) : "";
}

export function RequestWizard() {
  const user = useAuthStore((state) => state.user);
  const isCustomer = user?.role === "cliente";
  // Quem envia com a própria conta (cliente ou exportador): o remetente vem preenchido com os dados da conta.
  const accountSender = user?.role === "cliente" || user?.role === "exporter" ? user : null;
  const isHydrated = useHydrated();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<(ShipmentRequest & { accessToken: string }) | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [account, setAccount] = useState({ email: "", password: "" });
  const [accountError, setAccountError] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkedToAccount, setLinkedToAccount] = useState(false);
  const [allAgencies, setAllAgencies] = useState<Agency[] | null>(null);
  const [agenciesError, setAgenciesError] = useState("");
  const [suggestedCountry, setSuggestedCountry] = useState("");

  // Só se oferecem países de onde envia onde existe pelo menos uma agência ativa.
  const servedCodes = servedCountryCodes(allAgencies ?? []);
  const countryOptions = dispatchCountries.filter((country) => servedCodes.includes(country.code));

  const {
    control,
    register,
    handleSubmit,
    trigger,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentRequestInput>({
    resolver: zodResolver(shipmentRequestSchema),
    defaultValues,
  });

  // A sessão pode chegar depois do primeiro desenho: preenche o remetente quando chega, só nos campos vazios
  // (o indicativo sugerido pelo país conta como vazio), para nunca apagar o que a pessoa já escreveu.
  const accountSenderId = accountSender?.id;
  useEffect(() => {
    if (!accountSender) return;
    const current = getValues("sender");
    if (!current.name.trim() && accountSender.name) setValue("sender.name", accountSender.name);
    if (/^\+?\d{0,4}\s*$/.test(current.phone.trim()) && accountSender.phone) setValue("sender.phone", accountSender.phone);
    if (!current.email?.trim() && accountSender.email) setValue("sender.email", accountSender.email);
    // Uma vez por conta; as funções do formulário são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountSenderId]);

  // Sugere o indicativo enquanto o remetente ainda não escreveu o número.
  function suggestDialCode(countryCode: string) {
    const dialCode = getDispatchCountry(countryCode)?.dialCode;
    const currentPhone = getValues("sender.phone").trim();
    if (dialCode && (!currentPhone || /^\+\d{0,4}$/.test(currentPhone))) {
      setValue("sender.phone", `${dialCode} `);
    }
  }

  useEffect(() => {
    fetchAgencies()
      .then((agencies) => {
        setAllAgencies(agencies);
        // Pré-escolhe o país onde a pessoa parece estar, se ainda não escolheu nenhum.
        if (getValues("dispatchCountry")) return;
        const guess = guessDispatchCountry(readBrowserLocation(), servedCountryCodes(agencies));
        if (!guess) return;
        setValue("dispatchCountry", guess);
        setSuggestedCountry(guess);
        suggestDialCode(guess);
      })
      .catch(() => setAgenciesError("Não foi possível carregar as agências. Verifique a ligação e recarregue a página."));
    // Carrega uma vez; as funções do formulário são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const values = useWatch({ control });
  // Enquanto o remetente for o da conta, o cartão "Quem envia" explica de onde vêm os dados.
  const senderFromAccount = Boolean(accountSender && values.sender?.name === accountSender.name && values.sender?.email === accountSender.email);
  const category = values.category ?? "encomenda_pequena";
  const cargoType = getCargoType(category);
  const agencies = agenciesFor(allAgencies ?? [], {
    countryCode: values.dispatchCountry,
    category,
    island: values.recipient?.island,
  });
  const selectedAgency = agencies.find((agency) => agency.id === values.agencyId);
  const dispatchCountry = values.dispatchCountry ? getDispatchCountry(values.dispatchCountry) : undefined;

  const goNext = async () => {
    let valid = await trigger(stepFields[step]);

    if (step === 0) {
      for (const key of missingPublicFields(category, (values.details ?? {}) as Record<string, string>)) {
        const field = cargoType.publicFields.find((item) => item.key === key);
        setError(`details.${key}`, { message: `${field?.label ?? key} é obrigatório.` });
        valid = false;
      }
    }

    if (step === 1) {
      if (!selectedAgency) {
        setError("agencyId", { message: "Escolha uma agência que faça este tipo de envio para a ilha indicada." });
        valid = false;
      }
      if (values.handover === "recolha" && !values.pickupAddress?.trim()) {
        setError("pickupAddress", { message: "Indique a morada de recolha." });
        valid = false;
      }
    }

    if (valid) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onSubmit = async (input: ShipmentRequestInput) => {
    setSubmitError("");
    setAccountError("");

    if (!isCustomer && createAccount) {
      if (!/^\S+@\S+\.\S+$/.test(account.email) || account.password.length < 8) {
        setAccountError("Indique um email válido e uma palavra-passe com pelo menos 8 caracteres.");
        return;
      }
      try {
        // Cria a conta e inicia sessão; o pedido seguinte fica associado a ela.
        await registerCustomer({
          name: input.sender.name,
          email: account.email,
          phone: input.sender.phone,
          password: account.password,
        });
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : "Não foi possível criar a conta.");
        return;
      }
    }

    try {
      const request = await submitShipmentRequest(input);
      setLinkedToAccount(useAuthStore.getState().user?.role === "cliente");
      setSubmitted(request);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) {
        setSubmitError(error.issues.map((issue) => `${fieldNames[issue.path] ?? issue.path}: ${issue.message}`).join(" "));
      } else {
        setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
      }
    }
  };

  if (submitted) {
    const { agency } = submitted;
    return (
      <Card className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Pedido enviado à {agency?.name}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Guarde o código abaixo. A agência vai contactá-lo pelo telefone {submitted.sender.phone} para combinar a{" "}
          {submitted.handover === "recolha" ? "recolha" : "entrega na agência"}.
        </p>
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3">
          <span data-cy="request-reference" className="font-mono text-2xl font-semibold tracking-widest text-brand-800">{submitted.reference}</span>
          <button
            type="button"
            className="rounded-md p-1.5 text-brand-700 hover:bg-brand-100"
            aria-label="Copiar código"
            onClick={() => {
              void navigator.clipboard?.writeText(submitted.reference);
              setCopied(true);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-6 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
          {submitted.sender.email ? (
            <p>
              Enviámos um email para <strong className="text-slate-900">{submitted.sender.email}</strong> com o código e o link do
              pedido.
            </p>
          ) : null}
          <p>
            No{" "}
            <Link href={`/pedido/${submitted.accessToken}`} className="font-medium text-brand-700 hover:text-brand-800">
              link do seu pedido
            </Link>{" "}
            pode acompanhá-lo e cancelá-lo enquanto a agência não receber a carga. Guarde-o.
          </p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          {linkedToAccount ? (
            <Link href="/cliente">
              <Button className="w-full sm:w-auto">Ver os meus pedidos</Button>
            </Link>
          ) : (
            <Link href={`/pedido/${submitted.accessToken}`}>
              <Button className="w-full sm:w-auto">Ver o meu pedido</Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(null);
              setStep(0);
              setValue("description", "");
              setValue("details", {});
            }}
          >
            Fazer outro pedido
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl" data-cy="request-wizard" data-hydrated={isHydrated}>
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Passos">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined}>
            <div className={`h-1.5 rounded-full ${index <= step ? "bg-brand-600" : "bg-slate-200"}`} />
            <p className={`mt-2 hidden text-xs font-medium sm:block ${index === step ? "text-slate-900" : "text-slate-400"}`}>
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>
      <p className="mb-4 text-sm font-medium text-slate-500 sm:hidden">
        Passo {step + 1} de {steps.length} · {steps[step]}
      </p>

      {step === 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">O que quer enviar?</h2>
            <p className="text-sm text-slate-500">Escolha a opção mais próxima. A agência confirma os detalhes consigo.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cargoTypes.map((type) => {
              const selected = category === type.id;
              return (
                <label
                  key={type.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition ${
                    selected ? "border-brand-500 ring-4 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input type="radio" value={type.id} {...register("category")} className="sr-only" />
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      selected ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <CargoTypeIcon icon={type.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{type.publicLabel}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{type.examples}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {cargoType.publicFields.map((field) => {
                const error = (errors.details as Record<string, { message?: string }> | undefined)?.[field.key]?.message;
                const label = `${field.label}${field.required ? "" : " (opcional)"}${field.unit ? ` · ${field.unit}` : ""}`;
                return field.type === "select" ? (
                  <Select
                    key={`${category}-${field.key}`}
                    label={label}
                    options={[{ value: "", label: "—" }, ...(field.options ?? []).map((option) => ({ value: option, label: fieldValueLabel(field, option) }))]}
                    {...register(`details.${field.key}`, { onChange: () => clearErrors(`details.${field.key}`) })}
                    error={error}
                  />
                ) : (
                  <Input
                    key={`${category}-${field.key}`}
                    label={label}
                    type="text"
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    placeholder={field.placeholder}
                    {...register(`details.${field.key}`, { onChange: () => clearErrors(`details.${field.key}`) })}
                    error={error}
                  />
                );
              })}
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Descrição curta</span>
                <textarea
                  rows={3}
                  placeholder={category === "veiculo" ? "Ex.: carro usado a gasóleo, bom estado" : "Ex.: roupa, alimentos secos e um micro-ondas"}
                  {...register("description")}
                  className={`${fieldClasses} ${errors.description ? fieldErrorClasses : ""}`}
                />
                {errors.description ? <span className="mt-1 block text-xs text-rose-600">{errors.description.message}</span> : null}
              </label>
            </div>
            {category === "veiculo" ? (
              <div className="mt-4">
                <VehicleEstimate details={(values.details ?? {}) as Record<string, string | undefined>} dispatchCountry={values.dispatchCountry ?? null} />
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">De onde envia, para onde e com que agência?</h2>
            <p className="text-sm text-slate-500">Mostramos só as agências do país de onde envia que levam {cargoType.publicLabel.toLowerCase()} para a ilha escolhida.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="País de onde envia"
              options={[
                { value: "", label: "Escolha o país" },
                ...countryOptions.map((country) => ({ value: country.code, label: country.name })),
              ]}
              {...register("dispatchCountry", {
                onChange: (event: { target: { value: string } }) => {
                  clearErrors("dispatchCountry");
                  setValue("agencyId", "");
                  setSuggestedCountry("");
                  suggestDialCode(event.target.value);
                },
              })}
              error={errors.dispatchCountry?.message}
              hint={
                suggestedCountry && values.dispatchCountry === suggestedCountry
                  ? "Escolhido pela sua localização. Pode mudar se envia de outro país."
                  : undefined
              }
            />
            <Select
              label="Ilha de destino em Cabo Verde"
              options={caboVerdeIslands.map((island) => ({ value: island, label: island }))}
              {...register("recipient.island")}
              error={errors.recipient?.island?.message}
            />
          </div>

          {agenciesError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-700">
              {agenciesError}
            </div>
          ) : !allAgencies ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              A carregar agências…
            </div>
          ) : !values.dispatchCountry ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Escolha o país de onde envia para ver as agências disponíveis.
            </div>
          ) : agencies.length ? (
            <div className="grid gap-3">
              {agencies.map((agency) => {
                const selected = values.agencyId === agency.id;
                return (
                  <label
                    key={agency.id}
                    className={`flex cursor-pointer flex-col gap-3 rounded-xl border bg-white p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                      selected ? "border-brand-500 ring-4 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={agency.id}
                      {...register("agencyId", {
                        onChange: () => {
                          clearErrors("agencyId");
                          if (!agency.offersPickup) setValue("handover", "entrega_na_agencia");
                        },
                      })}
                      className="sr-only"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">{agency.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" /> {agency.city} · {agency.phone}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-2 text-xs">
                      {agency.offersPickup ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                          <Truck className="h-3.5 w-3.5" /> Faz recolha
                        </span>
                      ) : null}
                      {agency.nextDeparture ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5" /> Próxima saída {formatDate(agency.nextDeparture)}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma agência em {dispatchCountry?.name} envia este tipo de carga para {values.recipient?.island}. Experimente outra ilha ou tipo de carga.
            </div>
          )}
          {errors.agencyId ? <p className="text-sm text-rose-600">{errors.agencyId.message}</p> : null}

          {selectedAgency ? (
            <Card title="Como entrega a carga?">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "entrega_na_agencia", label: "Levo à agência", hint: selectedAgency.address, icon: StoreIcon, enabled: true },
                  { value: "recolha", label: "Quero que recolham", hint: "A agência combina dia e hora consigo", icon: Truck, enabled: selectedAgency.offersPickup },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      !option.enabled
                        ? "cursor-not-allowed border-slate-200 opacity-50"
                        : values.handover === option.value
                          ? "cursor-pointer border-brand-500 bg-brand-50/50"
                          : "cursor-pointer border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input type="radio" value={option.value} disabled={!option.enabled} {...register("handover")} className="sr-only" />
                    <option.icon className="mt-0.5 h-5 w-5 text-brand-700" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.enabled ? option.hint : "Esta agência não faz recolhas"}</span>
                    </span>
                  </label>
                ))}
              </div>
              {values.handover === "recolha" ? (
                <div className="mt-4">
                  <Input label="Morada de recolha" placeholder="Rua, nº, código postal, localidade" {...register("pickupAddress", { onChange: () => clearErrors("pickupAddress") })} error={errors.pickupAddress?.message} />
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card
            title="Quem envia"
            subtitle={
              senderFromAccount
                ? "Preenchido com os dados da sua conta. Pode alterar se envia em nome de outra pessoa."
                : dispatchCountry
                  ? `Em ${dispatchCountry.name}.`
                  : "No país de onde envia."
            }
          >
            <div className="space-y-4">
              <Input label="Nome" autoComplete="name" {...register("sender.name")} error={errors.sender?.name?.message} />
              <Input label="Telefone" type="tel" autoComplete="tel" {...register("sender.phone")} error={errors.sender?.phone?.message} hint={`Com indicativo do país, ex.: ${dispatchCountry?.dialCode ?? "+33"} …`} />
              <Input label="Email (opcional)" type="email" autoComplete="email" {...register("sender.email")} error={errors.sender?.email?.message} />
            </div>
          </Card>
          <Card title="Quem recebe" subtitle={`Em ${values.recipient?.island ?? "Cabo Verde"}.`}>
            <div className="space-y-4">
              <Input label="Nome" {...register("recipient.name")} error={errors.recipient?.name?.message} />
              <Input label="Telefone" type="tel" {...register("recipient.phone")} error={errors.recipient?.phone?.message} hint="Com indicativo, ex.: +238 991 22 33" />
              <Input label="NIF" inputMode="numeric" {...register("recipient.nif")} error={errors.recipient?.nif?.message} hint="Obrigatório para levantar a carga em Cabo Verde." />
            </div>
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <Card title="Resumo do pedido">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Summary label="Tipo de carga" value={cargoType.publicLabel} />
              <Summary label="Enviado de" value={dispatchCountry?.name} />
              <Summary label="Agência" value={selectedAgency?.name} />
              <Summary label="Descrição" value={values.description} />
              <Summary
                label="Entrega da carga"
                value={values.handover === "recolha" ? `Recolha em ${values.pickupAddress}` : "Leva à agência"}
              />
              {cargoType.publicFields
                .filter((field) => values.details?.[field.key])
                .map((field) => (
                  <Summary
                    key={field.key}
                    label={field.shortLabel ?? field.label}
                    value={`${fieldValueLabel(field, values.details?.[field.key] ?? "")}${field.unit ? ` ${field.unit}` : ""}`}
                  />
                ))}
              <Summary label="Remetente" value={`${values.sender?.name} · ${values.sender?.phone}`} />
              <Summary label="Destinatário" value={`${values.recipient?.name} · ${values.recipient?.phone} · ${values.recipient?.island}`} />
            </dl>
          </Card>

          {isCustomer ? (
            <p className="text-sm text-slate-500">O pedido fica associado à sua conta ({user.email}).</p>
          ) : accountSender ? (
            <p className="text-sm text-slate-500">
              Está a enviar com a sua conta ({accountSender.email}). Acompanhe o pedido pelo link que recebe no fim e por email.
            </p>
          ) : (
            <Card title="Quer criar conta?" subtitle="Opcional. Sem conta acompanha o pedido com o código e o seu telefone.">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: false, label: "Continuar sem conta" },
                  { value: true, label: "Criar conta para ver todos os meus envios" },
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium ${
                      createAccount === option.value ? "border-brand-500 bg-brand-50/50 text-slate-900" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="create-account"
                      checked={createAccount === option.value}
                      onChange={() => {
                        setCreateAccount(option.value);
                        if (option.value) {
                          setAccount((current) => ({ ...current, email: current.email || getValues("sender.email") || "" }));
                        }
                      }}
                      className="accent-brand-700"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {createAccount ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={account.email}
                    onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))}
                  />
                  <Input
                    label="Palavra-passe"
                    type="password"
                    autoComplete="new-password"
                    value={account.password}
                    onChange={(event) => setAccount((current) => ({ ...current, password: event.target.value }))}
                    hint="Pelo menos 8 caracteres."
                  />
                </div>
              ) : null}
              {accountError ? <p className="mt-3 text-sm text-rose-600">{accountError}</p> : null}
            </Card>
          )}
          {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
            Anterior
          </Button>
        ) : (
          <span />
        )}
        {step < steps.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Continuar
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "A enviar..." : "Enviar pedido à agência"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-slate-900">{value || "—"}</dd>
    </div>
  );
}
