/** The deployed channel can be set explicitly for custom domains. */
export type DeploymentEnvironment = 'recette' | 'production' | 'local';

export function deploymentEnvironment(
  hostname: string,
  channel: string | undefined = import.meta.env.VITE_OPALE_CHANNEL,
): DeploymentEnvironment {
  if (channel === 'recette' || channel === 'production') return channel;

  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return 'local';
  if (
    host === 'opale-ui-recette.vercel.app' ||
    /^opale-ui-recette-[a-z0-9-]+\.vercel\.app$/.test(host)
  ) {
    return 'recette';
  }
  return 'production';
}

export function deploymentLabel(hostname: string, channel?: string): string {
  const environment = deploymentEnvironment(hostname, channel);
  if (environment === 'recette') return 'En recette';
  if (environment === 'local') return 'En local';
  return 'En production';
}
