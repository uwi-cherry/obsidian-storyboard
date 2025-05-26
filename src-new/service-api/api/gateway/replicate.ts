export async function replicateChat(apiKey: string, payload: Record<string, unknown>): Promise<any> {
  const res = await fetch('https://api.replicate.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Replicate API Error: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}
