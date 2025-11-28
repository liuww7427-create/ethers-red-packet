import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConnection, useReadContract, useWriteContract } from "wagmi";
import RedPacketABI from "../abi/RedPacket1.json";

const CONSTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export default function ClaimPacket() {
    const write = useWriteContract();
    const { address, isConnected } = useConnection();
    const [searchParams] = useSearchParams();
    const [packetId, setPacketId] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    const claimedQuery = useReadContract({
        address: CONSTRACT_ADDRESS,
        abi: RedPacketABI,
        functionName: "hasUserClaimed",
        args: [packetId ? BigInt(packetId) : 0n, address ?? "0x0000000000000000000000000000000000000000"],
        query: { enabled: Boolean(packetId) && Boolean(address) },
    });

    useEffect(() => {
        const fromUrl = searchParams.get("packetId");
        if (fromUrl) {
            setPacketId(fromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        if (claimedQuery.data === true) {
            setStatus("你已经领取过这个红包，无需重复领取。");
        }
    }, [claimedQuery.data]);

    const claim = async () => {
        if (!packetId.trim()) {
            setStatus("请输入红包 ID");
            return;
        }
        if (!isConnected) {
            setStatus("请先连接钱包再领取红包");
            return;
        }
        if (claimedQuery.data === true) {
            setStatus("你已经领取过这个红包，无需重复领取。");
            return;
        }

        try {
            setIsClaiming(true);
            setStatus("正在领取红包...");
            await write.writeContractAsync({
                address: CONSTRACT_ADDRESS,
                abi: RedPacketABI,
                functionName: "claimPacket",
                args: [BigInt(packetId)],
            });

            setStatus("抢到红包啦！到详情页查看领取记录吧。");
        } catch (err) {
            const message = err instanceof Error ? err.message : "领取失败";
            const shortMsg = message.split("\n")[0];
            if (shortMsg.includes("claimed")) {
                setStatus("你已经领取过这个红包，无需重复领取。");
            } else {
                setStatus(`领取失败：${shortMsg}`);
            }
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div className="glass section">
            <h2>抢红包</h2>
            <p className="muted">输入红包 ID，点击领取；领取成功后可在详情页查看记录。</p>

            <div className="form-grid">
                <label className="label">
                    <span>红包 ID</span>
                    <input
                        className="input"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="例如 1"
                        value={packetId}
                        onChange={(e) => setPacketId(e.target.value)}
                    />
                </label>
            </div>

            <div className="actions">
                <button className="button-primary" onClick={claim} disabled={isClaiming}>
                    {isClaiming ? "领取中..." : "抢红包"}
                </button>
                {status && (
                    <span
                        className={`helper ${
                            status.startsWith("领取失败") ||
                            status.startsWith("请输入") ||
                            status.startsWith("请先连接") ||
                            status.startsWith("你已经领取过")
                                ? "error"
                                : "success"
                        }`}
                    >
                        {status}
                    </span>
                )}
            </div>
        </div>
    );
}
