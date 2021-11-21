export function swapItems<T>(arr: T[], from: number, to: number) {
  const tmp = arr[from];
  arr[from] = arr[to];
  arr[to] = tmp;
}
