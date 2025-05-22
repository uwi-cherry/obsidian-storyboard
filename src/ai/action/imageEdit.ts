import { App, TFile, normalizePath } from 'obsidian';

function b64ToUint8Array(b64: string): Uint8Array {
  const data = b64.includes(',') ? b64.split(',')[1] : b64;
  return Uint8Array.from(atob(data), c => c.charCodeAt(0));
}

function b64ToFile(b64: string, name: string): File {
  return new File([b64ToUint8Array(b64)], name, { type: 'image/png' });
}

export async function editImageToAssets(
  params: {
    prompt: string;
    apiKey: string;
    provider: 'fal' | 'replicate';
    app: App;
    fileName?: string;
    image?: string;
    mask?: string;
    reference?: string;
  }
): Promise<TFile> {
  const { prompt, apiKey, app, fileName, image, mask, reference } = params;
  const provider = params.provider;
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('n', '1');
  form.append('size', '1024x1024');
  form.append('response_format', 'b64_json');
  if (image) form.append('image', b64ToFile(image, 'image.png'));
  if (mask) form.append('mask', b64ToFile(mask, 'mask.png'));
  if (reference) form.append('reference_image', b64ToFile(reference, 'ref.png'));

  const endpoint =
    provider === 'fal'
      ? 'https://api.fal.ai/v1/predictions'
      : 'https://api.replicate.com/v1/predictions';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}`,
    },
    body: form,
  });
  if (!res.ok) throw new Error(`${provider} API エラー: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data?.output?.[0] as string | undefined;
  if (!b64) throw new Error('画像データが取得できませんでした');

  const bin = b64ToUint8Array(b64);

  const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
  const folder = normalizePath(`${activeDir}/assets`);
  const ext = 'png';
  let baseName = fileName ?? `generated-${Date.now()}.${ext}`;
  if (!baseName.endsWith(`.${ext}`)) baseName += `.${ext}`;
  let fullPath = `${folder}/${baseName}`;
  try {
    if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
  } catch {}
  let i = 1;
  while (app.vault.getAbstractFileByPath(fullPath)) {
    fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
    i++;
  }
  const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
  return imageFile;
}
