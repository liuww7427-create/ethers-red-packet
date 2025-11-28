import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
    argentWallet,
    bitgetWallet,
    metaMaskWallet,
    okxWallet,
    rabbyWallet,
    rainbowWallet,
    walletConnectWallet,
    injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
const projectId = import.meta.env.VITE_PROJECT_ID;
export const config = getDefaultConfig({
    appName: "RedPacketDapp",
    projectId,
    chains: [mainnet, sepolia],
    ssr: false,
    wallets: [{
        groupName: '主流钱包',
        wallets: [
            injectedWallet,
            // metaMaskWallet, //   切换主网络是会出现卡死，用上面的替换
            rainbowWallet,
            walletConnectWallet,
        ]
    }, {
        groupName: '更多钱包',
        wallets: [
            okxWallet,
            rabbyWallet,
            okxWallet,
            argentWallet,
            bitgetWallet
        ]
    }]
})
