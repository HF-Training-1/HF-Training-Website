/** Public connection settings. Never add an API key or password here. */
export const appwriteConfig = Object.freeze({
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6ab991cd000367ce7c09',
  websiteHostname: 'hf-training-1.github.io',
  supportEmail: 'Shane@hairforce-1.co.uk'
});

/**
 * Pass the Appwrite Web SDK namespace imported by the application.
 * This sets up clients only; it grants no role and creates no accounts.
 * Use an SDK version pinned and tested by the final application build.
 */
export function createAppwriteClients(Appwrite) {
  const client = new Appwrite.Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
  return { client, account: new Appwrite.Account(client) };
}

/** Opens a compose window only; delivery must never be reported as confirmed. */
export function supportMailto(subject = 'HF Training support request', message = '') {
  return `mailto:${appwriteConfig.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
