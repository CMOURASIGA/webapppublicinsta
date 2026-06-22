import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serverModule = require("./_server.cjs");
const app = serverModule.default ?? serverModule;
const initializeApp = serverModule.initializeApp ?? (async () => {});

let initializedPromise = null;

export default async function handler(req, res) {
  try {
    if (!initializedPromise) {
      initializedPromise = Promise.resolve().then(() => initializeApp());
    }

    await initializedPromise;
    return app(req, res);
  } catch (error) {
    console.error("[api] Failed to initialize server handler.", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Falha ao inicializar o backend.",
      });
    }

    throw error;
  }
}
