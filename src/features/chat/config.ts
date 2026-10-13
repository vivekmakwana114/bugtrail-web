/**
 * How long after sending you may still edit your message. Mirrors the API's rule
 * (bugtrail-api src/config/chat.js), which is what actually enforces it; here it only hides the
 * Edit action in time. After it, a message can still be deleted, not changed.
 */
export const MESSAGE_EDIT_WINDOW_MS = 15 * 1000;
