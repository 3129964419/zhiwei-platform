// 格式化工具
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`;

  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
};

export const formatPrice = (price: number): string => {
  return price % 1 === 0 ? `¥${price}` : `¥${price.toFixed(1)}`;
};

export const truncate = (text: string, max: number): string => {
  return text.length > max ? text.slice(0, max) + '...' : text;
};
