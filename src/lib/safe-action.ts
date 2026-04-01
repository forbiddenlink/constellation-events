import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient();

// Authenticated action — extend this with your auth provider
export const authAction = createSafeActionClient({
  async middleware(parsedInput) {
    // Add auth check here, e.g.:
    // const session = await getSession();
    // if (!session) throw new Error("Unauthorized");
    return parsedInput;
  },
});
