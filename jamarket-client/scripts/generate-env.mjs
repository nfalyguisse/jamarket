/**
 * Génère src/environments/*.ts à partir de process.env et/ou d'un fichier .env.
 * Sur Vercel, définir API_URL et CDN_URL dans Project → Settings → Environment Variables.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'src', 'environments');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(root, '.env'));
loadEnvFile(join(root, '.env.local'));

function pick(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

function escapeTsString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function writeEnvironment(fileName, { production, apiUrl, cdnUrl, sentryDsn }) {
  const sentryDsnField = sentryDsn
    ? `sentryDsn: '${escapeTsString(sentryDsn)}',`
    : 'sentryDsn: undefined,';

  const content = `/** Fichier généré par scripts/generate-env.mjs — ne pas éditer ni committer. */
export const environment = {
  production: ${production},
  apiUrl: '${escapeTsString(apiUrl)}',
  cdnUrl: '${escapeTsString(cdnUrl)}',
  ${sentryDsnField}
};
`;
  writeFileSync(join(outDir, fileName), content, 'utf8');
}

mkdirSync(outDir, { recursive: true });

const devApiUrl = pick('DEV_API_URL', 'API_URL', 'NG_APP_API_URL') ?? 'http://localhost:3000/api';
const devCdnUrl = pick('DEV_CDN_URL', 'CDN_URL', 'NG_APP_CDN_URL') ?? 'http://localhost:3000';

const prodApiUrl = pick('API_URL', 'NG_APP_API_URL') ?? 'http://localhost:3000/api';
const prodCdnUrl = pick('CDN_URL', 'NG_APP_CDN_URL') ?? 'http://localhost:3000';

const stagingApiUrl =
  pick('STAGING_API_URL', 'API_URL', 'NG_APP_API_URL') ?? 'http://localhost:3000/api';
const stagingCdnUrl =
  pick('STAGING_CDN_URL', 'CDN_URL', 'NG_APP_CDN_URL') ?? 'http://localhost:3000';

const sentryDsn = pick('SENTRY_DSN', 'NG_APP_SENTRY_DSN') ?? '';

const onVercel = process.env.VERCEL === '1';
const missingProd = !pick('API_URL', 'NG_APP_API_URL') || !pick('CDN_URL', 'NG_APP_CDN_URL');

if (onVercel && missingProd) {
  console.error(
    '[generate-env] Sur Vercel, définis les variables API_URL et CDN_URL (Project Settings → Environment Variables).',
  );
  process.exit(1);
}

const envPayload = { sentryDsn };

writeEnvironment('environment.ts', {
  production: false,
  apiUrl: devApiUrl,
  cdnUrl: devCdnUrl,
  ...envPayload,
});
writeEnvironment('environment.development.ts', {
  production: false,
  apiUrl: devApiUrl,
  cdnUrl: devCdnUrl,
  ...envPayload,
});
writeEnvironment('environment.staging.ts', {
  production: false,
  apiUrl: stagingApiUrl,
  cdnUrl: stagingCdnUrl,
  ...envPayload,
});
writeEnvironment('environment.production.ts', {
  production: true,
  apiUrl: prodApiUrl,
  cdnUrl: prodCdnUrl,
  ...envPayload,
});

console.log('[generate-env] Fichiers d’environnement générés dans src/environments/');
console.log(`  development → ${devApiUrl}`);
console.log(`  staging     → ${stagingApiUrl}`);
console.log(`  production  → ${prodApiUrl}`);
console.log(`  sentryDsn   → ${sentryDsn ? '(configuré)' : '(absent — no-op)'}`);
