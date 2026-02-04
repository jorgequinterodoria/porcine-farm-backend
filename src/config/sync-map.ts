// ⚠️ ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE.
// No lo edites manualmente. Ejecuta: npx tsx scripts/generate-sync-map.ts

export const SYNC_MODEL_MAP = {
  "Tenant": "tenants",
  "User": "users",
  "Breed": "breeds",
  "Medication": "medications",
  "Vaccine": "vaccines",
  "Disease": "diseases",
  "Facility": "facilities",
  "Pen": "pens",
  "Animal": "animals",
  "WeightRecord": "weight_records",
  "AnimalMovement": "animal_movements",
  "Batch": "batches",
  "BatchAnimal": "batch_animals",
  "BreedingService": "breeding_services",
  "Pregnancy": "pregnancies",
  "Farrowing": "farrowings",
  "Weaning": "weanings",
  "HealthRecord": "health_records",
  "Vaccination": "vaccinations",
  "MedicationTreatment": "medication_treatments",
  "MortalityRecord": "mortality_records",
  "FeedType": "feed_types",
  "FeedInventory": "feed_inventory",
  "FeedMovement": "feed_movements",
  "FeedConsumption": "feed_consumption",
  "TransactionCategory": "transaction_categories",
  "FinancialTransaction": "financial_transactions",
  "AnimalSale": "animal_sales",
  "AnimalSaleDetail": "animal_sale_details",
  "Task": "tasks"
} as const;

export type SyncModelName = keyof typeof SYNC_MODEL_MAP;
export type SyncTableName = (typeof SYNC_MODEL_MAP)[SyncModelName];

export const isSyncableTable = (tableName: string): boolean => {
  return Object.values(SYNC_MODEL_MAP).includes(tableName as SyncTableName);
};
