/**
 * ComfyUI Workflow Prompt Injection System & Validation
 * 
 * Handles different workflow patterns:
 * 1. Standard ComfyUI (KSampler + CLIPTextEncode)
 * 2. Direct prompt nodes (FluxKontextProImageNode, etc.)
 * 3. Advanced/Multi-stage (KSamplerAdvanced with multiple prompts)
 */

export interface InjectionParams {
  workflow: any;
  positivePrompt: string;
  negativePrompt?: string;
  imageName?: string;
  maskName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  supportedFeatures: {
    hasPromptCapability: boolean;
    hasImageInput: boolean;
    hasMaskInput: boolean;
    workflowType: 'standard' | 'direct-prompt' | 'advanced' | 'unknown';
  };
}

export class WorkflowInjector {
  /**
   * Validate workflow structure and capabilities
   */
  static validate(workflow: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      supportedFeatures: {
        hasPromptCapability: false,
        hasImageInput: false,
        hasMaskInput: false,
        workflowType: 'unknown'
      }
    };

    if (!workflow || typeof workflow !== 'object') {
      result.isValid = false;
      result.errors.push('Invalid workflow format');
      return result;
    }

    // Check for different workflow patterns
    const hasKSampler = this.findNodesByType(workflow, 'KSampler').length > 0;
    const hasKSamplerAdvanced = this.findNodesByType(workflow, 'KSamplerAdvanced').length > 0;
    const hasDirectPrompt = Object.values(workflow).some((node: any) => 
      node.inputs?.prompt && typeof node.inputs.prompt === 'string'
    );
    const hasLoadImage = this.findNodesByType(workflow, 'LoadImage').length > 0;
    const hasSaveImage = this.findNodesByType(workflow, 'SaveImage').length > 0;

    // Determine workflow type and capabilities
    if (hasKSampler || hasKSamplerAdvanced) {
      result.supportedFeatures.workflowType = hasKSamplerAdvanced ? 'advanced' : 'standard';
      result.supportedFeatures.hasPromptCapability = this.validateKSamplerPrompts(workflow);
    } else if (hasDirectPrompt) {
      result.supportedFeatures.workflowType = 'direct-prompt';
      result.supportedFeatures.hasPromptCapability = true;
    }

    result.supportedFeatures.hasImageInput = hasLoadImage;
    result.supportedFeatures.hasMaskInput = this.findNodesByType(workflow, 'LoadImage').length >= 2;

    // Validation checks
    if (!hasSaveImage) {
      result.errors.push('No SaveImage node found - workflow will not produce output');
      result.isValid = false;
    }

    if (!result.supportedFeatures.hasPromptCapability) {
      result.warnings.push('No prompt capability detected - text prompts may not work');
    }

    return result;
  }

  /**
   * Main injection method that handles all patterns
   */
  static inject(params: InjectionParams): void {
    const { workflow, positivePrompt, negativePrompt = "bad quality, blurry, low resolution" } = params;
    
    // Pattern 1 & 3: KSampler and KSamplerAdvanced nodes
    this.injectKSamplerPrompts(workflow, positivePrompt, negativePrompt);
    
    // Pattern 2: Direct prompt field nodes
    this.injectDirectPrompts(workflow, positivePrompt);
    
    // Handle image inputs if provided
    if (params.imageName) {
      this.injectImages(workflow, params.imageName, params.maskName);
    }
  }
  
  /**
   * Pattern 1 & 3: Handle KSampler and KSamplerAdvanced nodes
   * This covers both single and multi-stage workflows
   */
  private static injectKSamplerPrompts(workflow: any, positivePrompt: string, negativePrompt: string): void {
    Object.entries(workflow).forEach(([, node]: [string, any]) => {
      // Handle both KSampler and KSamplerAdvanced
      if (node.class_type === "KSampler" || node.class_type === "KSamplerAdvanced") {
        // Get connected prompt nodes
        const positiveNodeId = node.inputs.positive?.[0];
        const negativeNodeId = node.inputs.negative?.[0];
        
        // Update positive prompt
        if (positiveNodeId && workflow[positiveNodeId]) {
          const positiveNode = workflow[positiveNodeId];
          // Check if it's a CLIPTextEncode node
          if (positiveNode.class_type === "CLIPTextEncode") {
            positiveNode.inputs.text = positivePrompt;
          }
        }
        
        // Update negative prompt
        if (negativeNodeId && workflow[negativeNodeId]) {
          const negativeNode = workflow[negativeNodeId];
          // Check if it's a CLIPTextEncode node
          if (negativeNode.class_type === "CLIPTextEncode") {
            negativeNode.inputs.text = negativePrompt;
          }
        }
      }
    });
  }
  
  /**
   * Pattern 2: Handle nodes with direct prompt fields
   * e.g., FluxKontextProImageNode
   */
  private static injectDirectPrompts(workflow: any, prompt: string): void {
    Object.entries(workflow).forEach(([, node]: [string, any]) => {
      // Check if node has a direct prompt field
      if (node.inputs?.prompt && typeof node.inputs.prompt === 'string') {
        node.inputs.prompt = prompt;
      }
    });
  }
  
  /**
   * Inject image paths into LoadImage nodes
   */
  private static injectImages(workflow: any, imageName: string, maskName?: string): void {
    const loadImageNodes: Array<[string, any]> = [];
    
    // Collect all LoadImage nodes
    Object.entries(workflow).forEach(([id, node]: [string, any]) => {
      if (node.class_type === "LoadImage") {
        loadImageNodes.push([id, node]);
      }
    });
    
    // Assign images based on availability
    if (loadImageNodes.length > 0) {
      // First LoadImage gets the main image
      loadImageNodes[0][1].inputs.image = imageName;
      
      // Second LoadImage gets the mask (if inpainting)
      if (maskName && loadImageNodes.length > 1) {
        loadImageNodes[1][1].inputs.image = maskName;
      }
    }
  }
  
  /**
   * Utility: Find nodes by class type
   */
  static findNodesByType(workflow: any, classType: string): Array<[string, any]> {
    return Object.entries(workflow).filter(([id, node]: [string, any]) => 
      node.class_type === classType
    );
  }
  
  /**
   * Validate KSampler prompts connectivity
   */
  private static validateKSamplerPrompts(workflow: any): boolean {
    const kSamplers = [
      ...this.findNodesByType(workflow, 'KSampler'),
      ...this.findNodesByType(workflow, 'KSamplerAdvanced')
    ];

    return kSamplers.some(([, node]: [string, any]) => {
      const positiveNodeId = node.inputs.positive?.[0];
      const negativeNodeId = node.inputs.negative?.[0];
      
      const hasValidPositive = positiveNodeId && workflow[positiveNodeId]?.class_type === 'CLIPTextEncode';
      const hasValidNegative = negativeNodeId && workflow[negativeNodeId]?.class_type === 'CLIPTextEncode';
      
      return hasValidPositive && hasValidNegative;
    });
  }

  /**
   * Utility: Get node connected to input
   */
  static getConnectedNode(workflow: any, nodeId: string, inputName: string): [string, any] | null {
    const node = workflow[nodeId];
    if (!node) return null;
    
    const connection = node.inputs[inputName];
    if (!connection || !Array.isArray(connection)) return null;
    
    const connectedId = connection[0];
    const connectedNode = workflow[connectedId];
    
    return connectedNode ? [connectedId, connectedNode] : null;
  }
}