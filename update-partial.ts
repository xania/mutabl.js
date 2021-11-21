export default function updatePartial<T>(targetValue: T, newValue: T) {
  if (
    !targetValue ||
    typeof targetValue !== 'object' ||
    (!newValue && typeof newValue !== 'object')
  )
    return false;

  let b = false;
  const stack: any[] = [[targetValue, newValue]];
  const merged = new Set<any>();
  while (stack.length > 0) {
    const [targetValue, sourceValue] = stack.pop();
    if (!merged.add(targetValue))
      // stop recursion
      continue;

    for (let prop in sourceValue) {
      const sourcePropValue = sourceValue[prop];
      const targetPropValue = targetValue[prop];
      if (
        sourcePropValue === targetPropValue ||
        typeof targetPropValue === 'function'
      )
        continue;
      if (
        targetPropValue &&
        typeof targetPropValue === 'object' &&
        sourcePropValue &&
        typeof sourcePropValue === 'object'
      ) {
        stack.push([targetPropValue, sourcePropValue]);
      } else {
        if (targetPropValue !== sourcePropValue) {
          targetValue[prop] = sourcePropValue;
          b = true;
        }
      }
    }
  }
  return b;
}
