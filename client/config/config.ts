import { http, createConfig } from 'wagmi';
import { somniaTestnet } from 'wagmi/chains';
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors';

const projectId = 'eeb5920e2e3c8647a933850f8a8f71b6';

export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [injected(), walletConnect({ projectId }), metaMask(), safe()],
  ssr: true,
  transports: {
    [somniaTestnet.id]: http(),
  },
});
