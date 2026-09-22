// src/ai/model.mjs
// MODEL layer (Part 1 #9): model configuration, availability, health, routing.
// Single source of truth for model health — used by status.mjs.

export function checkModelHealth(aiCore, active) {
  if (!aiCore || !aiCore.provider) {
    return {
      status: "OFFLINE",
      reasonKm: "រកមិនឃើញ provider ក្នុង configuration",
      reasonEn: "No provider in model configuration",
    };
  }
  const busy = active.chat > 0;
  return {
    status: busy ? "ACTIVE" : "READY",
    reasonKm: busy ? "Model កំពុង process request" : "Model configuration មាន និងអាចប្រើបាន",
    reasonEn: busy ? "Model is processing a request" : "Model configuration exists and is usable",
    module: String(aiCore.provider),
  };
}

export function getModelInfo(aiCore) {
  return {
    provider: aiCore && aiCore.provider ? String(aiCore.provider) : null,
    configured: !!(aiCore && aiCore.provider),
  };
}
