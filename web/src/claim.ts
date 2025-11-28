import { useWriteContract } from "wagmi";
import RedPacketABI from "./abi/RedPacket.json";

const CONTRACT_ADDRESS = "0x123";

export function useClaimPacket() {
    const { writeContractAsync } = useWriteContract();

    const claim = async (packetId: string) => {
        return await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: RedPacketABI,
            functionName: 'claim',
            args: [packetId]
        })
    }

    return { claim }
}