/** Explicit model policy; legacy IDs remain readable for historical ledgers and controlled comparisons. */
export const MODEL_IDS = ['gpt-5.4-mini', 'gpt-5.4', 'gpt-5.6-luna', 'gpt-5.6-terra'] as const;
export type AppModel = typeof MODEL_IDS[number];
export function primaryModel(): AppModel {
  const value = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  if (!MODEL_IDS.includes(value as AppModel)) throw new Error('MODEL_NOT_ALLOWLISTED');
  return value as AppModel;
}
export function assessmentModels(): AppModel[] {
  const primary = primaryModel();
  return primary === 'gpt-5.6-luna' ? [primary, 'gpt-5.6-terra'] : primary === 'gpt-5.4-mini' ? [primary, 'gpt-5.4'] : [primary];
}
export function modelReasoning(model: AppModel): { effort: 'low' } | undefined {
  return model.startsWith('gpt-5.6-') ? { effort: 'low' } : undefined;
}
export function isFirstTier(model: AppModel): boolean {
  return model === 'gpt-5.6-luna' || model === 'gpt-5.4-mini';
}
export function outputLimit(model: AppModel, legacy: number, reasoning: number): number {
  return modelReasoning(model) ? model === 'gpt-5.6-terra' ? Math.min(reasoning, 4000) : reasoning : legacy;
}
