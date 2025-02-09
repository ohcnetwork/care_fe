export async function onRequest(context) {
  // Use the HEADER_POLICY binding
  return await context.env.HEADER_POLICY.fetch(context.request);
}
