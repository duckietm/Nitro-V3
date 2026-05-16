# Nitro V3

A modern Habbo Hotel client built with React, TypeScript, and Vite.

## Prerequisites

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/) >= 20
-   [Yarn](https://yarnpkg.com/) (`npm install -g yarn`)

## Installation

1. Clone the repositories:

```bash
git clone https://github.com/duckietm/Nitro-V3.git
git clone https://github.com/duckietm/Nitro_Render_V3.git
```

2. Link the renderer:

```bash
cd Nitro_Render_V3
yarn install
yarn link
```

3. Install dependencies and link the renderer:

```bash
cd ../Nitro-V3
yarn install
yarn link "@nitrots/nitro-renderer"
```

4. Copy and configure the configuration files:

```bash
cp public/configuration/renderer-config.example public/configuration/renderer-config.json
cp public/configuration/ui-config.example public/configuration/ui-config.json
cp public/configuration/client-mode.example public/configuration/client-mode.json
```

5. Update the configuration values:

-   **`renderer-config.json`**: Update `socket.url`, `asset.url`, `image.library.url`, and `hof.furni.url`
-   **`ui-config.json`**: Update `camera.url`, `thumbnails.url`, `url.prefix`, and `habbopages.url`

## Usage

### Development

Run in development mode with hot module replacement:

```bash
yarn start
```

### Production

Build for production:

```bash
yarn build
```

Or build with updated browser compatibility database:

```bash
yarn build:prod
```

The built files will be output to the `dist/` directory. Upload these to your webserver's client directory.

## Additional Resources

-   **Assets**: Generate `.nitro` assets using [nitro-converter](https://git.krews.org/nitro/nitro-converter)
-   **WebSockets**: Configure websockets using [Morningstar Websockets](https://git.krews.org/nitro/ms-websockets)
-   **Local Development**: See [docs/local-development-setup.md](docs/local-development-setup.md)
-   **Production Setup**: See [docs/secure-production-setup.md](docs/secure-production-setup.md)

## Configuration Override

You can override any configuration variable by passing it to `NitroConfig` in `index.html`.
