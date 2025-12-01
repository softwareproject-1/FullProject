export function buildUpdateMessage(entityLabel: string, fields: string[]) {
  if (!fields.length) {
    return `Updated ${entityLabel} successfully`;
  }

  const fieldList = fields.join(', ');
  return `Updated ${entityLabel} ${fieldList} successfully`;
}

export function buildDeleteMessage(entityLabel: string) {
  return `Deleted ${entityLabel} successfully`;
}
