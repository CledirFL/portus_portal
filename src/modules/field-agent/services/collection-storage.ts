import type { FieldCollection } from "@/modules/field-agent/types/collection";

const databaseName = "portus-field-agent";
const databaseVersion = 1;
const collectionStore = "collections";

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("O armazenamento local não está disponível neste navegador."));
  }

  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, databaseVersion);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(collectionStore)) {
          database.createObjectStore(collectionStore, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
      request.onblocked = () => reject(new Error("O armazenamento local está bloqueado por outra janela."));
    });
  }

  return databasePromise;
}

function waitForTransaction(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("A operação de armazenamento local falhou."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("A operação de armazenamento local foi cancelada."));
  });
}

export async function saveCollection(collection: FieldCollection) {
  const database = await openDatabase();
  const transaction = database.transaction(collectionStore, "readwrite");
  transaction.objectStore(collectionStore).put(collection);
  await waitForTransaction(transaction);
}

export async function listCollections(agentId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(collectionStore, "readonly");
  const request = transaction.objectStore(collectionStore).getAll() as IDBRequest<FieldCollection[]>;
  const result = await new Promise<FieldCollection[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Não foi possível carregar as recolhas guardadas."));
  });
  await waitForTransaction(transaction);

  return result
    .filter((collection) => collection.agentId === agentId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
