// eslint-disable-next-line @nx/enforce-module-boundaries
export * from './lib/source/typescript-ssdk-codegen/src/index';
import jsonModel from './lib/source/model/model.json';

/**
 * Extracts operation details including http trait, method, uri, and operation name.
 *
 * @param {any} model - The Smithy model JSON object.
 * @returns {Array<{operationName: string, method: string, uri: string}>} - An array of operation details.
 */
function extractHttpOperations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any
): Array<{ operationName: string; method: string; uri: string }> {
  const operations: Array<{
    operationName: string;
    method: string;
    uri: string;
  }> = [];

  if (!model || !model.shapes) {
    return operations; // Return empty array if model or shapes are missing
  }

  for (const shapeName in model.shapes) {
    // eslint-disable-next-line no-prototype-builtins
    if (model.shapes.hasOwnProperty(shapeName)) {
      const shape = model.shapes[shapeName];

      if (
        shape.type === 'operation' &&
        shape.traits &&
        shape.traits['smithy.api#http']
      ) {
        const httpTrait = shape.traits['smithy.api#http'];

        if (typeof httpTrait === 'object' && httpTrait !== null) {
          const method = httpTrait.method;
          const uri = httpTrait.uri;

          if (typeof method === 'string' && typeof uri === 'string') {
            operations.push({
              operationName: shapeName,
              method: method,
              uri: uri,
            });
          }
        }
      }
    }
  }

  return operations;
}

export const httpOperations = extractHttpOperations(jsonModel);
