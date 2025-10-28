# `create-preact`

<h2 align="center">
  <img height="256" width="256" src="./src/assets/preact.svg">
</h2>

<h3 align="center">Get started using Preact and Vite!</h3>

## Getting Started

- `npm run dev` - Starts a dev server at http://localhost:5173/

- `npm run build` - Builds for production, emitting to `dist/`

- `npm run preview` - Starts a server at http://localhost:4173/ to test production build locally

### Generate Swagger API client typescript code ( assuming the specification can be found at http://localhost:3000/openapi.json )

- `bun run generate` - OpenAPI code generator into /src/api/api.ts according to the OpenAPI specification

Note: add the following variable to src/api/api.ts after regenerating

```ts
public baseUrl: string =
    import.meta.env.MODE === "production"
      ? "https://my-website.space/backend/"
      : "http://localhost:3000";
```
