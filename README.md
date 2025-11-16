# `create-preact`

<h2 align="center">
  <img height="256" width="256" src="./src/assets/preact.svg">
</h2>

<h3 align="center">Get started using Preact and Vite!</h3>

## Getting Started

- `bun run dev` - Starts a dev server at http://localhost:5173/

- `bun run build` - Builds for production, emitting to `dist/`, with automatic fallback script generation

- `bun run preview` - Starts a server at http://localhost:4173/ to test production build locally

### Generate Swagger API client typescript code ( assuming the specification can be found at http://localhost:3000/openapi.json )

- `bun run generate` - OpenAPI code generator into /src/api/api.ts according to the OpenAPI specification

Note: add the following variable to src/api/api.ts after regenerating

```ts
public baseUrl: string =
    import.meta.env.MODE === "production"
      ? "https://my-website.space/backend/"
      : "http://localhost:3000";
```

## Build System

The build process automatically modifies the production `index.html` to include a fallback mechanism for aggressive networks that may block JavaScript files. When the main script fails to load, it falls back to a base64-encoded version of the script, fetched and decoded inline. This ensures compatibility with restricted environments like school networks.
