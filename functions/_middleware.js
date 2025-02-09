export async function onRequest(context) {
  // Log to verify middleware is running
  console.log("Middleware triggered");

  try {
    // Get the HEADER_POLICY binding from context
    const headerPolicy = context.env.HEADER_POLICY;

    if (!headerPolicy) {
      console.error("HEADER_POLICY binding not found");
      return context.next();
    }

    // Forward the request to the Worker
    const response = await headerPolicy.fetch(context.request);

    // Log success
    console.log("Header policy worker responded");

    return response;
  } catch (error) {
    console.error("Error in middleware:", error);
    // If something goes wrong, continue to the next middleware
    return context.next();
  }
}
