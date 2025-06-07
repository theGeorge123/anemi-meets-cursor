export async function getCities() {
  const res = await fetch('/functions/v1/get-cities');
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function getCafes(city: string) {
  const params = city ? `?city=${encodeURIComponent(city)}` : '';
  const res = await fetch(`/functions/v1/get-cafes${params}`);
  if (!res.ok) throw new Error('Failed to fetch cafes');
  return res.json();
}

export async function createInvitation(payload: unknown) {
  const res = await fetch('/functions/v1/create-invitation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create invitation');
  return res.json();
}
