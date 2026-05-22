export async function registerAddressWithAlchemy(address: string): Promise<void> {
  const webhookId = process.env.ALCHEMY_WEBHOOK_ID
  const authToken = process.env.ALCHEMY_AUTH_TOKEN

  if (!webhookId || !authToken || webhookId === 'pending') return

  const res = await fetch(
    `https://api.g.alchemy.com/webhooks/v1/${webhookId}/addresses`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Alchemy-Token': authToken,
      },
      body: JSON.stringify({ addresses_to_add: [address], addresses_to_remove: [] }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Alchemy register failed: ${text}`)
  }
}
