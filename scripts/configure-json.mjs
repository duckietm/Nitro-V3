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
    process.stdout.write('Configuration files (renderer-config, ui-config, gamedata)\ncan be parsed in two ways:\n\n');
    process.stdout.write('  1) JSON5  (recommended — accepts comments, trailing commas,\n               single quotes, unquoted identifiers)\n');
    process.stdout.write('  2) JSON   (legacy strict — only standard valid JSON)\n\n');
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
        rl.question('Choice [1=JSON5]: ', answer =>
        {
            const normalized = normalizeAnswer(answer);
            if(normalized === null)
            {
                process.stdout.write('  ↳ Invalid response. Please enter 1, 2, json5 or json.\n');
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
        process.stdout.write(`[configure-json] mode already configured: ${ existing.jsonMode } (skip)\n`);
        return;
    }
    if(nonInteractive)
    {
        const mode = existing?.jsonMode || DEFAULT_MODE;
        writeChoice(mode);
        process.stdout.write(`[configure-json] non-interactive — saved: ${ mode }\n`);
        return;
    }
    printBanner();
    if(existing) process.stdout.write(`Current mode: ${ existing.jsonMode }\n\n`);
    const choice = await promptUser();
    writeChoice(choice);
    process.stdout.write(`\n✓ Saved to .nitro-build.json — mode: ${ choice }\n`);
    if(choice === 'legacy')
    {
        process.stdout.write('  Warning: config files must be strict valid JSON\n  (no comments, no trailing commas).\n');
    }
    else
    {
        process.stdout.write('  JSON5 active: you can use comments, trailing commas and single quotes\n  in configuration files.\n');
    }
    process.stdout.write('\n  To change mode in the future: yarn configure\n\n');
};
main().catch(err =>
{
    process.stderr.write(`[configure-json] error: ${ err?.message || err }\n`);
    process.exit(1);
});