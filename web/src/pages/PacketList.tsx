import { useNavigate } from "react-router-dom";
import { useConnection, useReadContract, useReadContracts } from "wagmi";
import RedPacketABI from "../abi/RedPacket1.json";

const CONSTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

type PacketStruct = {
    id: bigint;
    sender: `0x${string}`;
    totalAmount: bigint;
    remainingAmount: bigint;
    totalCount: bigint;
    remainingCount: bigint;
    packetType: number;
    createdAt: bigint;
    exists: boolean;
};

export default function PacketList() {
    const navigate = useNavigate();
    const { address } = useConnection();

    const allPacketsQuery = useReadContract({
        address: CONSTRACT_ADDRESS,
        abi: RedPacketABI,
        functionName: "getAllPackets",
    });

    const packets = (allPacketsQuery.data as PacketStruct[] | undefined) ?? [];
    const parsed = packets.map((p) => ({
        id: Number(p.id),
        typeLabel: p.packetType === 0 ? "等额" : "拼手气",
        total: p.totalAmount,
        remaining: p.remainingAmount,
        countLabel: `${Number(p.totalCount - p.remainingCount)} / ${Number(p.totalCount)}`,
        createdAt: new Date(Number(p.createdAt) * 1000).toLocaleString(),
        isMine: address ? p.sender.toLowerCase() === address.toLowerCase() : false,
        sender: p.sender,
    }));

    const claimedQuery = useReadContracts({
        allowFailure: false,
        contracts: packets.map((p) => ({
            address: CONSTRACT_ADDRESS,
            abi: RedPacketABI,
            functionName: "hasUserClaimed",
            args: [p.id, address ?? "0x0000000000000000000000000000000000000000"],
        })),
        query: { enabled: Boolean(address) && packets.length > 0 },
    });

    const claimedMap =
        claimedQuery.data?.reduce<Record<number, boolean>>((acc, result, idx) => {
            acc[Number(packets[idx].id)] = Boolean(result);
            return acc;
        }, {}) ?? {};

    const loading = allPacketsQuery.isPending || claimedQuery.isPending;
    const error = allPacketsQuery.error || claimedQuery.error;

    const refresh = async () => {
        await Promise.all([allPacketsQuery.refetch(), claimedQuery.refetch()]);
    };

    return (
        <div className="glass section">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                    <h2>全部红包</h2>
                    <p className="muted">查看所有已创建的红包，快速跳转详情或去领取。</p>
                    <div className="actions" style={{ marginTop: 8 }}>
                        <span className="tag soft">总数：{parsed.length}</span>
                        {address && <span className="tag">已连接：{address.slice(0, 6)}...{address.slice(-4)}</span>}
                    </div>
                </div>
                <div className="actions">
                    <button className="button-ghost" onClick={() => navigate("/create")}>
                        去发红包
                    </button>
                    <button className="button-ghost" onClick={refresh}>
                        刷新
                    </button>
                </div>
            </div>

            {loading && <p className="helper">读取中...</p>}
            {error && <p className="helper error">错误: {(error as Error).message}</p>}

            {!loading && !error && (
                <>
                    {parsed.length > 0 ? (
                        <div className="list" style={{ marginTop: 14 }}>
                            <div className="list-row list-head" style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 1fr" }}>
                                <span>ID / 类型</span>
                                <span>剩余 / 金额</span>
                                <span>是否我创建</span>
                                <span>操作</span>
                            </div>
                            {parsed.map((item) => (
                                <div className="list-row" key={item.id} style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 1fr" }}>
                                    <span className="stat-value">#{item.id} · {item.typeLabel}</span>
                                    <div style={{ display: "grid", gap: 4 }}>
                                        <span className="helper">{item.countLabel}</span>
                                        <span className="helper">剩余 {Number(item.remaining) / 1e18} ETH</span>
                                    </div>
                                    <span className="helper" style={{ fontWeight: 700 }}>
                                        {item.isMine ? "是" : "否"}
                                    </span>
                                    <div className="actions" style={{ gap: 8, justifyContent: "flex-start" }}>
                                        <button
                                            className="button-primary"
                                            style={{ padding: "10px 14px", fontSize: 14 }}
                                            onClick={() => navigate(`/packet/${item.id}`)}
                                        >
                                            查看详情
                                        </button>
                                        {address && !claimedMap[item.id] && item.remaining > 0n && (
                                            <button
                                                className="button-ghost"
                                                style={{ padding: "10px 12px", fontSize: 13 }}
                                                onClick={() => navigate(`/claim?packetId=${item.id}`)}
                                            >
                                                去领取
                                            </button>
                                        )}
                                        {address && claimedMap[item.id] && (
                                            <span className="helper success">已领取</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="helper">暂时还没有红包记录。</p>
                    )}
                </>
            )}
        </div>
    );
}
