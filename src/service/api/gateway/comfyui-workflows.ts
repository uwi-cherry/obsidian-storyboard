/**
 * ComfyUI workflow templates for different generation types
 */

export interface WorkflowParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  checkpointName?: string;
  i2iImageName?: string;
  maskImageName?: string;
  denoise?: number;
}

export function createTextToImageWorkflow(params: WorkflowParams): any {
  const {
    prompt,
    negativePrompt = "bad quality, blurry, low resolution",
    width = 1024,
    height = 1024,
    steps = 20,
    cfg = 8,
    seed = Math.floor(Math.random() * 1000000),
    checkpointName = "sd_xl_base_1.0.safetensors"
  } = params;

  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": checkpointName
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "obsidian_generated",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

export function createImageToImageWorkflow(params: WorkflowParams): any {
  const {
    prompt,
    negativePrompt = "bad quality, blurry, low resolution",
    steps = 20,
    cfg = 8,
    seed = Math.floor(Math.random() * 1000000),
    checkpointName = "sd_xl_base_1.0.safetensors",
    i2iImageName,
    denoise = 0.7
  } = params;

  if (!i2iImageName) {
    throw new Error('i2iImageName is required for image-to-image workflow');
  }

  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": denoise,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["11", 0] // VAEEncode output
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": checkpointName
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "6": {
      "inputs": {
        "text": prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "obsidian_i2i",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    },
    "10": {
      "inputs": {
        "image": i2iImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "11": {
      "inputs": {
        "pixels": ["10", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEEncode"
    }
  };
}

export function createInpaintingWorkflow(params: WorkflowParams): any {
  const {
    prompt,
    negativePrompt = "bad quality, blurry, low resolution",
    steps = 20,
    cfg = 8,
    seed = Math.floor(Math.random() * 1000000),
    checkpointName = "sd_xl_base_1.0.safetensors",
    i2iImageName,
    maskImageName,
    denoise = 1.0
  } = params;

  if (!i2iImageName || !maskImageName) {
    throw new Error('Both i2iImageName and maskImageName are required for inpainting workflow');
  }

  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": denoise,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["13", 0] // VAEEncodeForInpaint output
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": checkpointName
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "6": {
      "inputs": {
        "text": prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "obsidian_inpaint",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    },
    "10": {
      "inputs": {
        "image": i2iImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "12": {
      "inputs": {
        "image": maskImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "13": {
      "inputs": {
        "pixels": ["10", 0],
        "vae": ["4", 2],
        "mask": ["12", 1] // mask from LoadImage
      },
      "class_type": "VAEEncodeForInpaint"
    }
  };
}