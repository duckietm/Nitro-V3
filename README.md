# v2.2.0 -Nitro V3 !! Use at Own Risk as it is still in Beta !!

## Prerequisites

-   [Git](https://git-scm.com/)
-   [NodeJS](https://nodejs.org/) >= 18
    - If using NodeJS < 18 remove `--openssl-legacy-provider` from the package.json scripts
-   [Yarn](https://yarnpkg.com/) `npm i yarn -g`

## Quick install (recommended)

The repository ships a cross-platform installer that performs the full setup
in one go: prerequisites check, renderer clone & link, dependency install,
config copy, JSON parsing mode selection, URL prompt with validation, and the
production build.

After cloning Nitro V3, from its root run:

```
# Windows
install.bat

# Linux / macOS
./install.sh
```

Both wrappers just exec `node install.mjs`, so you can also invoke it directly:

```
node install.mjs
```

The installer walks through these steps:

```
[1/9] Check prerequisites (node >= 18, yarn, git)
[2/9] Clone Nitro_Render_V3
[3/9] Setup renderer (yarn install + yarn link)
[4/9] Setup client (yarn install + yarn link "@nitrots/nitro-renderer")
[5/9] Copy public/configuration/*.example -> *.json
[6/9] Choose JSON parsing mode (json5 recommended) -> writes .nitro-build.json
[7/9] Configure URLs (interactive, validated)
[8/9] Build (yarn build)
[9/9] Summary
```

### Headless / CI runs

Every step can be driven from flags so the installer can be used in pipelines:

```
node install.mjs --non-interactive \
    --json-mode=json5 \
    --socket-url=wss://example.com/ws \
    --api-url=https://example.com \
    --asset-url=https://example.com/nitro-assets/ \
    --image-library-url=https://example.com/c_images \
    --hof-furni-url=https://example.com/hof_furni \
    --camera-url=https://example.com/camera \
    --thumbnails-url=https://example.com/thumbnails \
    --habbopages-url=/habbopages \
    --api-base-url=https://example.com \
    --plain-config-base-url=https://example.com/configuration \
    --plain-gamedata-base-url=https://example.com/gamedata \
    --skip-link
```

Useful workflow flags:

-   `--non-interactive` / `--skip-prompts` — keep example defaults unless a URL override is passed
-   `--json-mode=<json5\|legacy\|auto>` — pick the parser without the JSON mode prompt
-   `--skip-build`, `--skip-clone`, `--skip-link` — re-runs without redoing those steps
-   `--help` — full flag reference and per-key URL flags

`install.mjs` is idempotent: re-running it keeps any `*.json` config files
that already exist and only patches the URL keys you pass on the CLI.

## Installation (manual)

-   First you should open terminal and navigate to the folder where you want to clone Nitro and Nitro-Renderer
-   Clone Nitro (Expl. C:\Github\)
    -   `git clone https://github.com/duckietm/Nitro-V3.git` <== For now switch to Dev-RendererV2 
	-   `git clone https://github.com/duckietm/Nitro_Render_V3.git`
	-   Install the dependencies for the renderer : cd C:\Github\Nitro_Render_V3
    	-   `yarn install`
	-	Now we will create a Link for the Nitro Renderer : `yarn link` This will give you a link address `yarn link "@nitrots/nitro-renderer"`
    -   Install the dependencies for Cool UI : cd C:\Github\Nitro-V3
	-   `yarn install`
	-   `yarn link "@nitrots/nitro-renderer"` <== This will link the renderer in the project
-   Rename a few files
    -   Copy `public/configuration/renderer-config.example` to `public/configuration/renderer-config.json`
    -   Copy `public/configuration/ui-config.example` to `public/configuration/ui-config.json`
    -   Copy `public/configuration/client-mode.example` to `public/configuration/client-mode.json`
    -   Set your links
    -   Open `public/configuration/renderer-config.json`
        -   Update `socket.url, asset.url, image.library.url, & hof.furni.url`
    -   Open `public/configuration/ui-config.json`
        -   Update `camera.url, thumbnails.url, url.prefix, habbopages.url`
	-   `yarn build` <== the final step to build the DIST folder this is where your browser needs to point / or upload this to your /client if you do the compile on a other machine (preferd)
    -   You can override any variable by passing it to `NitroConfig` in the index.html

## JSON / JSON5 configuration mode

Starting with this version of Nitro V3, you can choose how the client parses the
configuration files (`renderer-config.json`, `ui-config.json`, `client-mode.json`,
and the gamedata JSONs served by the renderer):

-   **JSON5** (recommended) — accepts comments, trailing commas, single quotes
    and unquoted identifiers. Easier to maintain, especially in `ui-config.json`
    where you may want inline notes.
-   **JSON (legacy strict)** — only valid standard JSON is accepted. Any comment
    or trailing comma will fail the load with a clear error.

### Picking a mode

The first time you run `yarn start` or `yarn build`, an interactive prompt asks
which mode to use:

```
════════════════════════════════════════════════════════════
  Nitro V3 — JSON mode configuration
════════════════════════════════════════════════════════════

  1) JSON5  (recommended)
  2) JSON   (legacy strict)

Scelta [1=JSON5]:
```

Your choice is stored in `.nitro-build.json` at the project root (gitignored, so
each deployment keeps its own setting). Subsequent builds reuse it silently.

### Changing the mode later

Run the prompt again at any time:

```
yarn configure
```

You can also set the mode without interaction (useful in CI / scripts):

```
# one-shot override for a single build
NITRO_JSON_MODE=legacy yarn build
NITRO_JSON_MODE=json5  yarn build

# write the choice persistently
echo '{"jsonMode":"legacy"}' > .nitro-build.json
```

The recognized values are `legacy`, `json5`, and `auto` (auto = try strict JSON
first, fall back to JSON5 — equivalent to the original Render V3 behaviour).

### How it propagates

The chosen mode is injected at build time as the compile-time constant
`__NITRO_JSON_MODE__`. It is honoured by:

-   `src/bootstrap.ts` when loading `client-mode.json`
-   `@nitrots/utils` → `JsonParser.ts` in Render V3, used for every config file
    and every gamedata JSON loaded by the renderer

In `legacy` mode, an invalid file produces a clear error that suggests switching
to JSON5; nothing is silently coerced.

## Usage

-   To use Nitro you need `.nitro` assets generated, see [nitro-converter](https://git.krews.org/nitro/nitro-converter) for instructions
-   See [Morningstar Websockets](https://git.krews.org/nitro/ms-websockets) for instructions on configuring websockets on your server

### Development

Run Nitro in development mode when you are editing the files, this way you can see the changes in your browser instantly

```
yarn start
```

### Production

To build a production version of Nitro just run the following command

```
yarn build:prod
```

-   A `dist` folder will be generated, these are the files that must be uploaded to your webserver
-   Consult your CMS documentation for compatibility with Nitro and how to add the production files
