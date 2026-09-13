export const whatsappUrl = (phone: string): string | null => {
  let n = (phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!n) return null;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0") || (n.length === 10 && n.startsWith("3"))) n = "39" + n;
  return `https://wa.me/${n}`;
};

export const openWhatsApp = (phone: string) => {
  const url = whatsappUrl(phone);
  if (url) window.open(url, "_blank");
};
