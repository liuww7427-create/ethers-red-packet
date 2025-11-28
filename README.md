
# Ethers Red Packet

双包结构的红包 DApp，包括基于 Hardhat 的合约项目和基于 Vite + React 的前端。
## 1、初始化项目
1) Init web project
```bash
npm create vite@latest web -- --template react-ts
```
安装依赖
```bash
npm i wagmi viem @rainbow-me/rainbowkit @tanstack/react-query ethers 
```
安装钱包SDK
```bash
npm i @coinbase/wallet-sdk @metamask/sdk @walletconnect/ethereum-provider
```
2) 初始化合约项目
```bash
    mkdir contracts && cd contracts
    npm init -y
    npx hardhat --init
```

## 2、目录结构
- `contracts/`：Solidity 合约与 Hardhat 配置
- `web/`：前端界面（Vite + React + Wagmi/RainbowKit）

### 快速开始
1) 安装依赖  
```bash
cd contracts && npm install
cd ../web && npm install
```

2) 环境变量（合约）  
在仓库根目录创建 `.env`，示例：  
```bash
SEPOLIA_RPC_URL=<Your_Sepolia_RPC>
SEPOLIA_PRIVATE_KEY=<Your_Private_Key>
```

3) 合约开发常用命令  
- 编译：`cd contracts && npm run compile`
- 测试：`cd contracts && npm test`
- 部署到 Sepolia：`cd contracts && npm run deploy`

4) 前端开发常用命令  
- 本地启动：`cd web && npm run dev`
- 构建产物：`cd web && npm run build`
- 预览构建：`cd web && npm run preview`

### 其他说明
- Git 忽略规则见根目录 `.gitignore`；合约与前端各自的生成产物已被忽略。
- 若需切换到其他网络，请在 `contracts/hardhat.config.ts` 中调整网络配置并更新对应环境变量。
