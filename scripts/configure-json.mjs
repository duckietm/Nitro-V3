#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const CONFIG_FILE = resolve(PROJECT_ROOT, '.nitro-build.json');
const VALID_MODES = new Set(['legacy', 'json5']);
const DEFAULT_MODE = 'json5';

const args = process.argv.slice(2);
const ifMissing = args.includes('--if-missing');
const nonInteractive = args.includes('--non-interactive') || !process.stdin.isTTY;

const readExisting = () =>
{
    if(!existsSync(CONFIG_FILE)) return null;

    try
    {
        const raw = readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if(parsed && VALID_MODES.has(parsed.jsonMode)) return parsed;
    }
    catch {}

    return null;
};

const writeChoice = (mode) =>
{
    const payload = {
        jsonMode: mode,
        configuredAt: new Date().toISOString()
    };
    writeFileSync(CONFIG_FILE, `${ JSON.stringify(payload, null, 2) }\n`, 'utf8');
};

const printBanner = () =>
{
    const line = '═'.repeat(60);
    process.stdout.write(`\n${ line }\n  Nitro V3 — JSON mode configuration\n${ line }\n\n`);
    process.stdout.write('I file di configurazione (renderer-config, ui-config, gamedata)\npossono essere parsati in due modi:\n\n');
    process.stdout.write('  1) JSON5  (consigliato — accetta commenti, trailing comma,\n               single quote, identifier non quotati)\n');
    process.stdout.write('  2) JSON   (legacy strict — solo JSON valido standard)\n\n');
};

const normalizeAnswer = (raw) =>
{
    const v = (raw || '').trim().toLowerCase();
    if(!v || v === '1' || v === 'json5' || v === 'y' || v === 'yes') return 'json5';
    if(v === '2' || v === 'json' || v === 'legacy' || v === 'n' || v === 'no') return 'legacy';
    return null;
};

const promptUser = () => new Promise(resolveFn =>
{
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = () =>
    {
        rl.question('Scelta [1=JSON5]: ', answer =>
        {
            const normalized = normalizeAnswer(answer);
            if(normalized === null)
            {
                process.stdout.write('  ↳ Risposta non valida. Inserisci 1, 2, json5 o json.\n');
                return ask();
            }
            rl.close();
            resolveFn(normalized);
        });
    };

    ask();
});

const main = async () =>
{
    const existing = readExisting();

    if(ifMissing && existing)
    {
        process.stdout.write(`[configure-json] modalità già configurata: ${ existing.jsonMode } (skip)\n`);
        return;
    }

    if(nonInteractive)
    {
        const mode = existing?.jsonMode || DEFAULT_MODE;
        writeChoice(mode);
        process.stdout.write(`[configure-json] non interattivo — salvato: ${ mode }\n`);
        return;
    }

    printBanner();
    if(existing) process.stdout.write(`Modalità corrente: ${ existing.jsonMode }\n\n`);

    const choice = await promptUser();
    writeChoice(choice);

    process.stdout.write(`\n✓ Salvato in .nitro-build.json — modalità: ${ choice }\n`);
    if(choice === 'legacy')
    {
        process.stdout.write('  Attenzione: i file di config devono essere JSON valido stretto\n  (no commenti, no trailing comma).\n');
    }
    else
    {
        process.stdout.write('  JSON5 attivo: puoi usare commenti, trailing comma e single quote\n  nei file di configurazione.\n');
    }
    process.stdout.write('\n  Per cambiare modalità in futuro: yarn configure\n\n');
};

main().catch(err =>
{
    process.stderr.write(`[configure-json] errore: ${ err?.message || err }\n`);
    process.exit(1);
});
