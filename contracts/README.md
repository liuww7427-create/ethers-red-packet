# RedPacket 合约说明

链上红包系统，支持等额/拼手气红包、全量/分页列表、领取记录、防重复抢。前端可按 ID 抢或查看详情。

## 合约文件
- `contracts/contracts/RedPacket.sol`
- 编译输出 ABI：`artifacts/contracts/RedPacket.sol/RedPacket.json`

## 核心特性
- 创建红包：指定总金额、份数、类型（等额/随机），记录创建时间。
- 领取红包：防重入、防重复领取，自动更新剩余金额/份数。
- 查询接口：单个红包详情、领取记录、某地址创建的红包列表、全量/分页红包列表、是否领取过。

## 主要方法
- `createPacket(PacketType packetType, uint256 totalCount)` payable  
  - `packetType`: 0 等额，1 拼手气  
  - `totalCount`: 份数，需 > 0  
  - `msg.value`: 总金额
- `claimPacket(uint256 packetId)` 领取指定红包。
- `getPacket(uint256 packetId)` 返回单个红包详情。
- `getPacketClaims(uint256 packetId)` 返回领取记录。
- `getPacketsBySender(address sender)` 返回该地址创建的红包 ID 列表。
- `getAllPackets()` 返回全部红包（小规模可直接用）。
- `getPackets(uint256 offset, uint256 limit)` 分页返回红包列表。
- `hasUserClaimed(uint256 packetId, address user)` 查询是否已领取。

### 返回的主要字段
- `Packet`: `id, sender, totalAmount, remainingAmount, totalCount, remainingCount, packetType, createdAt, exists`
- `Claim`: `claimer, amount, timestamp`

## 本地开发
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## 部署
1) 在 `contracts/.env` 配置网络 RPC 和私钥，例如：
```
SEPOLIA_RPC=https://...
SEPOLIA_PRIVATE_KEY=0xabc...
```
2) 运行部署脚本（示例）：
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
部署成功后记录输出的合约地址，前端 `.env` 中的 `VITE_CONTRACT_ADDRESS` 使用该地址。

## 前端集成提示
- 发红包调用：`createPacket(packetType, totalCount, { value: totalAmountWei })`
- 抢红包调用：`claimPacket(packetId)`
- 列表展示：小规模用 `getAllPackets()`；如需分页用 `getPackets(offset, limit)`。
- 详情页：`getPacket(packetId)` + `getPacketClaims(packetId)`。
- 防重复提示：可用 `hasUserClaimed(packetId, userAddress)`。
