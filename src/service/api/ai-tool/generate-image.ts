import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import { fal } from '@fal-ai/client';

namespace Internal {
  export interface GenerateImageInput {
    prompt: string;
    apiKey: string;
    app: App;
    fileName?: string;
    imageUrls?: string[];
    guidanceScale?: number;
    numImages?: number;
    aspectRatio?: string;
    seed?: number;
  }

  export interface GenerateImageOutput {
    filePath: string;
    message: string;
    seed?: number;
  }

  export const GENERATE_IMAGE_METADATA = {
    name: 'generate_image',
    description: 'Generate image via FLUX.1 Kontext Max Multi and save to assets',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        apiKey: { type: 'string', description: 'API key' },
        app: { type: 'object', description: 'Obsidian app instance' },
        fileName: { type: 'string', description: 'File name', nullable: true },
        imageUrls: { 
          type: 'array', 
          description: 'Reference image URLs for context', 
          items: { type: 'string' },
          nullable: true 
        },
        guidanceScale: { 
          type: 'number', 
          description: 'CFG scale (1.0-20.0)', 
          minimum: 1.0, 
          maximum: 20.0,
          nullable: true 
        },
        numImages: { 
          type: 'integer', 
          description: 'Number of images to generate (1-4)', 
          minimum: 1, 
          maximum: 4,
          nullable: true 
        },
        aspectRatio: { 
          type: 'string', 
          description: 'Aspect ratio (e.g., "1:1", "16:9", "9:16")',
          nullable: true 
        },
        seed: { 
          type: 'integer', 
          description: 'Seed for reproducible results',
          nullable: true 
        }
      },
      required: ['prompt', 'apiKey', 'app']
    }
  } as const;

  export async function executeGenerateImage(args: GenerateImageInput): Promise<string> {
    const { 
      prompt, 
      apiKey, 
      app, 
      fileName,
      imageUrls = [],
      guidanceScale = 3.5,
      numImages = 1,
      aspectRatio = "1:1",
      seed
    } = args;

    try {
      // Configure fal.ai client
      fal.config({ credentials: apiKey });

      // Prepare input for FLUX Kontext Max Multi
      const input: any = {
        prompt,
        guidance_scale: guidanceScale,
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: "jpeg"
      };

      // Add image URLs for multi-image context if provided
      if (imageUrls.length > 0) {
        input.image_urls = imageUrls;
      }

      // Add seed if provided
      if (seed !== undefined) {
        input.seed = seed;
      }

      // Generate image using FLUX Kontext Max Multi
      const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
        input,
        logs: false
      });

      if (!result.data?.images?.[0]?.url) {
        throw new Error('画像生成に失敗しました: 結果にURLが含まれていません');
      }

      const imageUrl = result.data.images[0].url;
      const generatedSeed = result.data.seed;

      // Download the generated image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`画像のダウンロードに失敗しました: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Prepare file path
      const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
      const folder = normalizePath(`${activeDir}/assets`);
      const ext = 'jpg'; // FLUX outputs JPEG
      let baseName = fileName ?? `flux-generated-${Date.now()}.${ext}`;
      if (!baseName.endsWith(`.${ext}`)) {
        baseName = baseName.replace(/\.[^.]*$/, '') + `.${ext}`;
      }
      
      // Ensure assets folder exists
      try {
        if (!app.vault.getAbstractFileByPath(folder)) {
          await app.vault.createFolder(folder);
        }
      } catch (error) {
        console.warn('Failed to create assets folder:', error);
      }

      // Handle file name conflicts
      let fullPath = normalizePath(`${folder}/${baseName}`);
      let counter = 1;
      while (app.vault.getAbstractFileByPath(fullPath)) {
        const nameWithoutExt = baseName.replace(/\.[^.]*$/, '');
        fullPath = normalizePath(`${folder}/${nameWithoutExt}_${counter}.${ext}`);
        counter++;
      }

      // Save the image file
      const imageFile: TFile = await app.vault.createBinary(fullPath, uint8Array);
      
      const output: GenerateImageOutput = {
        filePath: imageFile.path,
        message: `FLUX画像を生成しました: ${imageFile.path}`,
        seed: generatedSeed
      };
      
      return JSON.stringify(output);

    } catch (error) {
      console.error('FLUX image generation error:', error);
      throw new Error(`画像生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const generateImageTool: Tool<Internal.GenerateImageInput> = {
  name: 'generate_image',
  description: 'Generate image via FLUX.1 Kontext Max Multi and save to assets',
  parameters: Internal.GENERATE_IMAGE_METADATA.parameters,
  execute: Internal.executeGenerateImage
};