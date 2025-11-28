import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicClient, useWriteContract } from "wagmi";
import { decodeEventLog, parseEther } from "viem";
import RedPacketABI from "../abi/RedPacket1.json";

const CONSTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function CreatePacket() {
    const navigate = useNavigate();
    const write = useWriteContract();
    const publicClient = usePublicClient();
    const [amount, setAmount] = useState("");
    const [count, setCount] = useState("");
    const [packetType, setPacketType] = useState<"random" | "fixed">("random");
    const [status, setStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdId, setCreatedId] = useState<number | null>(null);

    const handleSend = async () => {
        if (!amount || !count) {
            setStatus("请填写金额和数量");
            return;
        }

        const totalCount = Number(count);
        if (!Number.isInteger(totalCount) || totalCount <= 0) {
            setStatus("数量需要是正整数");
            return;
        }

        try {
            setIsSubmitting(true);
            setStatus("正在创建红包...");
            const hash = await write.writeContractAsync({
                address: CONSTRACT_ADDRESS,
                abi: RedPacketABI,
                functionName: "createPacket",
                args: [packetType === "fixed" ? 0 : 1, totalCount],
                value: parseEther(amount)
            });

            let packetIdFromEvent: number | null = null;
            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: RedPacketABI,
                            data: log.data,
                            topics: log.topics
                        });
                        if (decoded.eventName === "PacketCreated") {
                            const pid = Number(decoded.args.packetId);
                            packetIdFromEvent = pid;
                            break;
                        }
                    } catch {
                        // ignore decoding errors on unrelated logs
                    }
                }
            }

            setStatus("红包已创建，分享 ID 给朋友来抢吧！");
            if (packetIdFromEvent !== null) {
                setCreatedId(packetIdFromEvent);
            }
            setAmount("");
            setCount("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "未知错误";
            setStatus(`创建失败：${message.split("\n")[0]}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass section">
            <h2>发红包</h2>
            <p className="muted">设置红包金额、数量和类型，让朋友来拼手气或等额领取。</p>

            <div className="form-grid">
                <label className="label">
                    <span>金额 (ETH)</span>
                    <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="例如 0.2"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </label>

                <label className="label">
                    <span>数量</span>
                    <input
                        className="input"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="想分成几份？"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                    />
                </label>
            </div>

            <div className="label" style={{ marginBottom: 10 }}>
                <span>红包类型</span>
                <div className="select-row">
                    <button
                        type="button"
                        className={`chip ${packetType === "random" ? "active" : ""}`}
                        onClick={() => setPacketType("random")}
                    >
                        拼手气（随机）
                    </button>
                    <button
                        type="button"
                        className={`chip ${packetType === "fixed" ? "active" : ""}`}
                        onClick={() => setPacketType("fixed")}
                    >
                        等额红包
                    </button>
                </div>
            </div>

            <div className="actions">
                <button className="button-primary" onClick={handleSend} disabled={isSubmitting}>
                    {isSubmitting ? "发送中..." : "发红包"}
                </button>
                {createdId !== null && (
                    <button
                        className="button-ghost"
                        onClick={() => navigate(`/claim?packetId=${createdId}`)}
                        style={{ padding: "10px 14px", fontSize: 14 }}
                    >
                        去分享红包 #{createdId}
                    </button>
                )}
                {status && (
                    <span
                        className={`helper ${
                            status.startsWith("红包已创建") ? "success" : status.startsWith("创建失败") ? "error" : ""
                        }`}
                    >
                        {status}
                    </span>
                )}
            </div>
            {createdId !== null && (
                <p className="helper success" style={{ marginTop: 8 }}>
                    分享链接：/claim?packetId={createdId}（点击上方按钮直接跳转）
                </p>
            )}
        </div>
    );
}
