/**
 * Utility functions for workflow operations
 */

/**
 * Check if a node is an API node based on common patterns
 */
function isAPINode(classType: string): boolean {
  // Known API node class_types based on documentation and examples
  const knownAPINodeTypes = [
    // Black Forest Labs Flux nodes
    'FluxKontextProImageNode',
    'FluxKontextMaxImageNode',
    'FluxProUltraImageNode',
    'Flux1ProNode',
    'Flux1DevNode',
    'Flux1SchnellNode',
    // Google nodes
    'Veo2Node',
    'Gemini25ProNode',
    'Gemini25FlashNode',
    // OpenAI nodes
    'GPTImage1Node',
    'DallE2Node',
    'DallE3Node',
    // Stability AI nodes
    'StableImageUltraNode',
    'StableDiffusion35LargeNode',
    // Others
    'IdeogramV3Node',
    'IdeogramV2Node',
    'LumaPhotonNode',
    'LumaRay2Node',
    'RecraftV3Node',
    'Pika22Node',
    'TripoV25Node'
  ];
  
  // Check if it's a known API node type
  return knownAPINodeTypes.includes(classType);
}

/**
 * Extract model name from API node
 */
function getAPINodeModelName(node: any): string {
  // Extract readable name from class_type
  let modelName = node.class_type
    .replace(/(Image|Text|Video)?Node$/, '') // Remove suffixes
    .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
    .trim();
  
  // Use title if available and more descriptive
  if (node._meta?.title && !node._meta.title.includes('画像') && !node._meta.title.includes('Load') && !node._meta.title.includes('Save')) {
    modelName = node._meta.title;
  }
  
  return `${modelName} (API)`;
}

/**
 * Extract model name from ComfyUI workflow JSON
 * @param workflow - ComfyUI workflow JSON object
 * @returns Model name with (API) suffix if it's an API node, or model name without extension for local models
 */
export function getModelNameFromWorkflow(workflow: any): string {
  try {
    // First, check for API nodes
    for (const nodeId in workflow) {
      const node = workflow[nodeId];
      if (isAPINode(node.class_type)) {
        return getAPINodeModelName(node);
      }
    }
    
    // Then, check for local checkpoint loaders
    for (const nodeId in workflow) {
      const node = workflow[nodeId];
      if (node.class_type === 'CheckpointLoaderSimple' && node.inputs?.ckpt_name) {
        const modelFile = node.inputs.ckpt_name;
        // Extract model name without extension
        return modelFile.replace(/\.(safetensors|ckpt|pt)$/i, '');
      }
    }
  } catch (e) {
    console.error('Failed to extract model name:', e);
  }
  return 'Default Workflow';
}