export type ShareNetwork = 'x' | 'whatsapp' | 'facebook';

export interface ShareTarget {
  url: string;
  text: string;
}

export const SHARE_NETWORKS: ShareNetwork[] = ['x', 'whatsapp', 'facebook'];

export function buildShareUrl(network: ShareNetwork, target: ShareTarget): string {
  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodeURIComponent(target.url)}&text=${encodeURIComponent(target.text)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(target.text + ' ' + target.url)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(target.url)}`;
  }
}
