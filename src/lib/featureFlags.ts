export function isRootPageEnabled() {
  const raw =
    process.env.NEXT_PUBLIC_ENABLE_ROOT_PAGE ?? process.env.ENABLE_ROOT_PAGE;
  return String(raw).toLowerCase() === "true";
}
