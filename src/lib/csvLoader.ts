import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import type { Loader } from 'astro/loaders';

export interface IdStrategyFixed {
  kind: 'fixed';
  id: string;
}

export interface IdStrategyColumn {
  kind: 'column';
  column: string;
}

export interface IdStrategyComposite {
  kind: 'composite';
  columns: string[];
  separator: string;
}

export type IdStrategy = IdStrategyFixed | IdStrategyColumn | IdStrategyComposite;

export interface CsvLoaderOptions {
  idStrategy: IdStrategy;
  transform?: (row: Record<string, string | undefined>) => Record<string, unknown>;
}

function normalizeRow(
  row: Record<string, string>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.trim()] = value.trim() === '' ? undefined : value.trim();
  }
  return out;
}

function getId(
  row: Record<string, string | undefined>,
  strategy: IdStrategy,
): string {
  switch (strategy.kind) {
    case 'fixed':
      return strategy.id;
    case 'column':
      return row[strategy.column] ?? 'unknown';
    case 'composite':
      return strategy.columns.map((c) => row[c] ?? '').join(strategy.separator);
  }
}

export function csvLoader(
  relativePath: string,
  options: CsvLoaderOptions,
): Loader {
  return {
    name: 'csv-loader',
    load: async ({ store, logger, parseData }) => {
      const filePath = path.resolve(relativePath);

      if (!fs.existsSync(filePath)) {
        logger.error(`CSV file not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, errors } = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
      });

      // FieldMismatch warnings (e.g., a row with fewer columns than the header)
      // are non-fatal: missing trailing columns simply become undefined.
      // Hard parse errors still abort the load.
      const fatal = errors.filter((e) => e.type !== 'FieldMismatch');
      if (fatal.length > 0) {
        logger.error(
          `CSV parse errors in ${relativePath}: ${JSON.stringify(fatal)}`,
        );
        return;
      }

      store.clear();

      for (const rawRow of data) {
        const normalized = normalizeRow(rawRow);
        const id = getId(normalized, options.idStrategy);
        const transformed = options.transform
          ? options.transform(normalized)
          : normalized;

        const parsed = await parseData({ id, data: transformed });
        store.set({ id, data: parsed });
      }
    },
  };
}
