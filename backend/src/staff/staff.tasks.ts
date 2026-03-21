export function extractLinkedOrderId(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const record = metadata as Record<string, unknown>;
  if (record.taskKind !== 'ORDER_DELIVERY') {
    return undefined;
  }

  return typeof record.orderId === 'string' ? record.orderId : undefined;
}
