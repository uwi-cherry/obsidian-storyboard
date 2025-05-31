export async function falChatCompletions(apiKey: string, payload: Record<string, unknown>): Promise<any> {
  const res = await fetch('https://api.fal.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`fal.ai API error: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}
