export const getPurchaseUrl = (): string | null => {
  const url = import.meta.env.VITE_PURCHASE_URL?.trim();
  return url ? url : null;
};
