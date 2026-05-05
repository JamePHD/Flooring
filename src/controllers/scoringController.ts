import { scoreProducts, ScoringRequest } from "../models/scoringModel";

export async function handleScoreProducts(request: ScoringRequest) {
  if (!request.weights || request.weights.length === 0) {
    throw { message: "At least one scoring weight is required", status: 400 };
  }

  // Validate weights are between 0 and 1
  for (const w of request.weights) {
    if (!w.attribute_id) {
      throw { message: "Each weight needs an attribute_id", status: 400 };
    }
    if (w.weight < 0 || w.weight > 1) {
      throw { message: "Weights must be between 0 and 1", status: 400 };
    }
  }

  return await scoreProducts(request);
}