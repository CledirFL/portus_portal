"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import {
  collectionFieldsSchema,
  emptyCollectionFields,
  type CollectionFormValues,
} from "@/modules/field-agent/schemas/collection";
import { parseOcrText, recognizeCollectionPhoto } from "@/modules/field-agent/services/ocr";
import { saveCollection } from "@/modules/field-agent/services/collection-storage";
import type { FieldCollection } from "@/modules/field-agent/types/collection";

const maximumPhotoSize = 10 * 1024 * 1024;

export function CollectionForm() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState("");
  const [saveError, setSaveError] = useState("");

  const {
    control,
    getValues,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFieldsSchema),
    defaultValues: emptyCollectionFields,
  });

  const currentFields = useWatch({ control });
  const currentSnapshot = JSON.stringify(currentFields);
  const isReviewConfirmed = confirmedSnapshot === currentSnapshot;
  const photoPreviewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : ""), [photo]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const onPhotoChange = (file?: File) => {
    setPhotoError("");
    setOcrError("");
    setRecognizedText("");
    setConfirmedSnapshot("");

    if (!file) {
      setPhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhoto(null);
      setPhotoError("Selecione uma fotografia num formato de imagem.");
      return;
    }

    if (file.size > maximumPhotoSize) {
      setPhoto(null);
      setPhotoError("A fotografia não pode exceder 10 MB.");
      return;
    }

    setPhoto(file);
  };

  const onReadPhoto = async () => {
    if (!photo) {
      setPhotoError("Tire ou selecione uma fotografia antes de iniciar a leitura.");
      return;
    }

    setIsReadingPhoto(true);
    setOcrError("");
    setConfirmedSnapshot("");

    try {
      const text = await recognizeCollectionPhoto(photo);
      setRecognizedText(text);

      const suggestions = parseOcrText(text);
      for (const [field, value] of Object.entries(suggestions) as Array<
        [keyof CollectionFormValues, CollectionFormValues[keyof CollectionFormValues]]
      >) {
        setValue(field, value, { shouldDirty: true, shouldValidate: true });
      }
    } catch (error) {
      setOcrError(
        error instanceof Error
          ? `Não foi possível ler a fotografia: ${error.message}`
          : "Não foi possível ler a fotografia. Pode preencher os campos manualmente.",
      );
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const onSubmit = async (fields: CollectionFormValues) => {
    if (!user || !photo) {
      setPhotoError("Inicie sessão e adicione uma fotografia para guardar a recolha.");
      return;
    }

    if (confirmedSnapshot !== JSON.stringify(getValues())) {
      return;
    }

    const collection: FieldCollection = {
      id: `REC-${crypto.randomUUID()}`,
      agentId: user.id,
      agentName: user.name,
      createdAt: new Date().toISOString(),
      status: "Confirmado pelo agente",
      fields,
      photo,
      photoName: photo.name,
      recognizedText,
    };

    setSaveError("");

    try {
      await saveCollection(collection);
      router.push("/agent/collections");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Não foi possível guardar a recolha.",
      );
    }
  };

  const senderName = register("senderName");
  const senderPhone = register("senderPhone");
  const recipientName = register("recipientName");
  const recipientDocumentNumber = register("recipientDocumentNumber");
  const recipientPhone = register("recipientPhone");
  const contentDescription = register("contentDescription");
  const weightKg = register("weightKg");
  const volumeM3 = register("volumeM3");
  const lengthCm = register("lengthCm");
  const widthCm = register("widthCm");
  const heightCm = register("heightCm");

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Nova recolha</h2>
        <p className="text-sm text-slate-500">
          Fotografe a encomenda, reveja os dados sugeridos e confirme-os antes de registar.
        </p>
      </div>

      <div
        role="note"
        className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        Este MVP guarda os dados e as fotografias apenas neste navegador. Não são sincronizados
        com outros dispositivos nem enviados para o portal operacional.
      </div>

      <Card title="Fotografia da encomenda">
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Tirar ou selecionar fotografia
            </span>
            <input
              accept="image/*"
              capture="environment"
              data-cy="collection-photo"
              onChange={(event) => onPhotoChange(event.target.files?.[0])}
              type="file"
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:font-medium file:text-sky-800"
            />
          </label>
          {photoError ? <p role="alert" className="text-sm text-rose-700">{photoError}</p> : null}
          {photoPreviewUrl ? (
            <div className="flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreviewUrl}
                alt="Pré-visualização da fotografia da encomenda"
                className="max-h-64 max-w-full rounded-lg border border-slate-200 object-contain"
              />
              <p className="text-sm text-slate-600">{photo?.name}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              data-cy="read-photo"
              disabled={!photo || isReadingPhoto}
              onClick={onReadPhoto}
            >
              {isReadingPhoto ? "A ler a fotografia..." : "Ler dados da fotografia"}
            </Button>
            {isReadingPhoto ? <span role="status">A preparar o OCR em português…</span> : null}
          </div>
          {ocrError ? <p role="alert" className="text-sm text-rose-700">{ocrError}</p> : null}
          {recognizedText ? (
            <div
              data-cy="ocr-result"
              className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"
            >
              <p className="font-semibold">Texto reconhecido — confirme cada campo abaixo.</p>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-sans">
                {recognizedText}
              </pre>
            </div>
          ) : null}
          <p className="text-xs text-slate-500">
            O reconhecimento é uma sugestão e pode conter erros. A fotografia é processada neste
            navegador; confirme os dados antes de os guardar.
          </p>
        </div>
      </Card>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-6"
        data-cy="collection-form"
      >
        <Card title="Remetente e destinatário">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              data-cy="sender-name"
              label="Nome do remetente"
              {...senderName}
              error={errors.senderName?.message}
            />
            <Input
              data-cy="sender-phone"
              label="Contacto do remetente"
              {...senderPhone}
              error={errors.senderPhone?.message}
            />
            <Input
              data-cy="recipient-name"
              label="Nome do destinatário"
              {...recipientName}
              error={errors.recipientName?.message}
            />
            <div>
              <Select
                data-cy="recipient-document-type"
                label="Tipo de documento"
                options={[
                  { value: "NIF", label: "NIF" },
                  { value: "BI", label: "BI" },
                  { value: "Passaporte", label: "Passaporte" },
                ]}
                {...register("recipientDocumentType")}
                error={errors.recipientDocumentType?.message}
              />
            </div>
            <Input
              data-cy="recipient-document-number"
              label="N.º de identificação"
              {...recipientDocumentNumber}
              error={errors.recipientDocumentNumber?.message}
            />
            <Input
              data-cy="recipient-phone"
              label="Contacto do destinatário"
              {...recipientPhone}
              error={errors.recipientPhone?.message}
            />
          </div>
        </Card>

        <Card title="Conteúdo e dimensões">
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              data-cy="content-description"
              label="Conteúdo declarado"
              {...contentDescription}
              error={errors.contentDescription?.message}
              className="sm:col-span-2 lg:col-span-3"
            />
            <Input
              data-cy="weight-kg"
              label="Peso (kg)"
              inputMode="decimal"
              {...weightKg}
              error={errors.weightKg?.message}
            />
            <Input
              data-cy="volume-m3"
              label="Volume (m³), se conhecido"
              inputMode="decimal"
              {...volumeM3}
              error={errors.volumeM3?.message}
            />
            <Input
              data-cy="length-cm"
              label="Comprimento (cm)"
              inputMode="decimal"
              {...lengthCm}
              error={errors.lengthCm?.message}
            />
            <Input
              data-cy="width-cm"
              label="Largura (cm)"
              inputMode="decimal"
              {...widthCm}
              error={errors.widthCm?.message}
            />
            <Input
              data-cy="height-cm"
              label="Altura (cm)"
              inputMode="decimal"
              {...heightCm}
              error={errors.heightCm?.message}
            />
          </div>
          {errors.volumeM3 ? (
            <p className="mt-2 text-sm text-rose-700">{errors.volumeM3.message}</p>
          ) : null}
        </Card>

        <Card title="Confirmação do agente">
          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                checked={isReviewConfirmed}
                data-cy="review-confirmation"
                onChange={(event) =>
                  setConfirmedSnapshot(event.target.checked ? currentSnapshot : "")
                }
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              <span>
                Confirmo que revi e corrigi os dados da encomenda e que correspondem à
                fotografia.
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                data-cy="save-collection"
                disabled={!isReviewConfirmed || isSubmitting}
              >
                {isSubmitting ? "A guardar…" : "Confirmar e registar recolha"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/agent/collections")}
              >
                Cancelar
              </Button>
            </div>
            {saveError ? <p role="alert" className="text-sm text-rose-700">{saveError}</p> : null}
          </div>
        </Card>
      </form>
    </AppShell>
  );
}
