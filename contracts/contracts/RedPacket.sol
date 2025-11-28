// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RedPacket {

    enum PacketType { Fixed, Random }

    struct Packet {
        uint256 id;
        address sender;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 totalCount;
        uint256 remainingCount;
        PacketType packetType;
        bool exists;
    }

    struct Claim {
        address claimer;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public nextPacketId;

    mapping(uint256 => Packet) public packets;
    mapping(uint256 => Claim[]) public packetClaims;

    // 每个地址发过哪些红包
    mapping(address => uint256[]) public packetsBySender;

    event PacketCreated(
        uint256 indexed packetId,
        address indexed sender,
        uint256 totalAmount,
        uint256 totalCount,
        PacketType packetType
    );

    event PacketClaimed(
        uint256 indexed packetId,
        address indexed claimer,
        uint256 amount
    );

    // ---- 创建红包 ----
    function createPacket(PacketType packetType, uint256 totalCount) external payable {
        require(msg.value > 0, "no ETH");
        require(totalCount > 0, "count must > 0");

        uint256 packetId = nextPacketId++;

        packets[packetId] = Packet({
            id: packetId,
            sender: msg.sender,
            totalAmount: msg.value,
            remainingAmount: msg.value,
            totalCount: totalCount,
            remainingCount: totalCount,
            packetType: packetType,
            exists: true
        });

        packetsBySender[msg.sender].push(packetId);

        emit PacketCreated(packetId, msg.sender, msg.value, totalCount, packetType);
    }

    // ---- 抢红包 ----
    function claimPacket(uint256 packetId) external {
        Packet storage p = packets[packetId];
        require(p.exists, "packet not found");
        require(p.remainingCount > 0, "no more");

        uint256 amount;

        if (p.packetType == PacketType.Fixed) {
            amount = p.totalAmount / p.totalCount;
        } else {
            // 随机红包：剩余金额 * (10~50%) / 剩余人数
            uint256 min = p.remainingAmount / p.remainingCount / 2;
            uint256 max = p.remainingAmount / p.remainingCount;
            amount = min + (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % (max - min + 1));
        }

        p.remainingAmount -= amount;
        p.remainingCount--;

        packetClaims[packetId].push(Claim(msg.sender, amount, block.timestamp));

        emit PacketClaimed(packetId, msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    // ---- 获取红包详情 ----
    function getPacket(uint256 packetId) external view returns (Packet memory) {
        return packets[packetId];
    }

    // ---- 获取某个红包的抢红包记录 ----
    function getPacketClaims(uint256 packetId) external view returns (Claim[] memory) {
        return packetClaims[packetId];
    }

    // ---- 获取某用户发过的红包列表 ----
    function getPacketsBySender(address sender) external view returns (uint256[] memory) {
        return packetsBySender[sender];
    }
}
