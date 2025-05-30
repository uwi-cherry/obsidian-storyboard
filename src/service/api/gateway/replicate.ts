export async function replicateChatCompletions(apiKey: string, payload: Record<string, unknown>): Promise<any> {
  const res = await fetch('https://api.replicate.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Replicate API error: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}
