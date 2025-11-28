import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatEther } from 'viem'
import { useReadContract } from 'wagmi'
import RedPacketABI from '../abi/RedPacket1.json'

const CONSTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

type PacketTuple = readonly [bigint, `0x${string}`, bigint, bigint, bigint, bigint, number, bigint, boolean]
type PacketStruct = {
  id: bigint
  sender: `0x${string}`
  totalAmount: bigint
  remainingAmount: bigint
  totalCount: bigint
  remainingCount: bigint
  packetType: number | bigint
  createdAt: bigint
  exists: boolean
}

type ClaimTuple = readonly [`0x${string}`, bigint, bigint]
type ClaimStruct = {
  claimer: `0x${string}`
  amount: bigint
  timestamp: bigint
}

export default function PacketDetail() {
  const { packetId } = useParams()
  const packetIdArg = packetId ? BigInt(packetId) : 0n
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const claimsQuery = useReadContract({
    address: CONSTRACT_ADDRESS,
    abi: RedPacketABI,
    functionName: 'getPacketClaims',
    args: [packetIdArg],
    query: { enabled: Boolean(packetId) },
  })

  const packetQuery = useReadContract({
    address: CONSTRACT_ADDRESS,
    abi: RedPacketABI,
    functionName: 'getPacket',
    args: [packetIdArg],
    query: { enabled: Boolean(packetId) },
  })

  const formatAmount = (value?: bigint) => (value !== undefined ? `${Number(formatEther(value)).toFixed(4)} ETH` : '--')
  const formatDate = (timestamp?: bigint) =>
    timestamp !== undefined && timestamp > 0n ? new Date(Number(timestamp) * 1000).toLocaleString() : '--'

  const normalizePacket = (p?: PacketTuple | PacketStruct) => {
    if (!p) return undefined
    if (Array.isArray(p)) {
      const [id, sender, totalAmount, remainingAmount, totalCount, remainingCount, packetType, createdAt, exists] = p
      return { id, sender, totalAmount, remainingAmount, totalCount, remainingCount, packetType, createdAt, exists }
    }
    return {
      id: p.id,
      sender: p.sender,
      totalAmount: p.totalAmount,
      remainingAmount: p.remainingAmount,
      totalCount: p.totalCount,
      remainingCount: p.remainingCount,
      packetType: Number(p.packetType),
      createdAt: p.createdAt,
      exists: p.exists,
    }
  }

  const normalizeClaims = (arr?: ClaimTuple[] | ClaimStruct[]) => {
    if (!arr) return []
    if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0] as any)) {
      return (arr as ClaimTuple[]).map((c) => ({ claimer: c[0], amount: c[1], timestamp: c[2] }))
    }
    return (arr as ClaimStruct[]).map((c) => ({
      claimer: c.claimer,
      amount: c.amount,
      timestamp: c.timestamp,
    }))
  }

  const packet = normalizePacket(packetQuery.data as PacketTuple | PacketStruct | undefined)
  const claims = normalizeClaims(claimsQuery.data as ClaimTuple[] | ClaimStruct[] | undefined)

  const loading = claimsQuery.isPending || packetQuery.isPending
  const error = claimsQuery.error || packetQuery.error

  const exists = packet?.exists === true
  const totalAmount = exists ? formatAmount(packet?.totalAmount) : '--'
  const remainingAmount = exists ? formatAmount(packet?.remainingAmount) : '--'
  const totalCount = packet?.totalCount
  const remainingCount = packet?.remainingCount
  const claimedCount =
    totalCount !== undefined && remainingCount !== undefined ? Number(totalCount - remainingCount) : null
  const packetTypeLabel = exists ? (packet?.packetType === 0 ? '等额红包' : '拼手气红包') : '--'

  const refresh = async () => {
    await Promise.all([claimsQuery.refetch(), packetQuery.refetch()])
    setLastUpdated(new Date())
  }

  return (
    <div className="glass section">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2>红包详情</h2>
          <p className="muted">查看单个红包的领取进度和历史记录。</p>
          <div className="actions" style={{ marginTop: 8 }}>
            <span className="tag soft">ID #{packetId}</span>
            {exists && <span className="tag">{packetTypeLabel}</span>}
            {lastUpdated && <span className="tag">刚刚刷新：{lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>
        <button className="button-ghost" onClick={refresh}>
          刷新红包信息
        </button>
      </div>

      {loading && <p className="helper">读取中...</p>}
      {error && <p className="helper error">错误: {(error as Error).message}</p>}
      {!loading && !error && packet && packet.exists === false && (
        <p className="helper error">未找到红包，检查 ID 是否正确。</p>
      )}

      <div className="card-grid" style={{ marginTop: 10 }}>
        <div className="stat">
          <div className="stat-title">红包金额</div>
          <div className="stat-value">{totalAmount}</div>
          <span className="tag soft">剩余 {remainingAmount}</span>
        </div>
        <div className="stat">
          <div className="stat-title">份数</div>
          <div className="stat-value">
            {claimedCount !== null && totalCount !== undefined
              ? `${claimedCount} / ${Number(totalCount)} 已被领取`
              : '--'}
          </div>
          <span className="tag">{remainingCount !== undefined ? `剩余 ${Number(remainingCount)} 份` : '等待读取'}</span>
        </div>
        <div className="stat">
          <div className="stat-title">创建者</div>
          <div className="stat-value" style={{ fontSize: 16, wordBreak: 'break-all' }}>
            {exists ? packet?.sender : '--'}
          </div>
          <span className={`tag ${packet?.exists === false ? 'alert' : 'soft'}`}>
            {packet?.exists === false ? '未找到红包' : '合约已记录'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ margin: 0 }}>领取记录</h3>
          <span className="helper">{claims.length} 条记录</span>
        </div>

        <div className="list">
          <div className="list-row list-head">
            <span>领取人</span>
            <span>金额</span>
            <span>时间</span>
          </div>
          {claims.length > 0 ? (
            claims.map((claim, index) => (
              <div className="list-row" key={`${claim.claimer}-${index}`}>
                <span style={{ wordBreak: 'break-all' }}>{claim.claimer}</span>
                <span>{formatAmount(claim.amount)}</span>
                <span>{formatDate(claim.timestamp)}</span>
              </div>
            ))
          ) : (
            <div className="list-row">
              <span className="helper">尚无领取记录</span>
              <span className="helper">--</span>
              <span className="helper">--</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
