export function wilson(k: number, n: number, invert = false) {
  if (n <= 0) throw new Error('Trial count must be positive');
  const z = 1.959963984540054, p = k / n, denominator = 1 + z*z/n;
  const center = (p + z*z/(2*n)) / denominator;
  const half = z / denominator * Math.sqrt(p*(1-p)/n + z*z/(4*n*n));
  const lower = Math.max(0,center-half), upper = Math.min(1,center+half);
  return invert ? {value:1-p, lower:1-upper, upper:1-lower} : {value:p,lower,upper};
}
