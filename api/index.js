import app, { initializeApp } from "./_server.cjs";

let initializedPromise = null;

export default async function handler(req, res) {
  if (!initializedPromise) {
    initializedPromise = initializeApp();
  }

  await initializedPromise;
  return app(req, res);
}
