export const average = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

export const round = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

