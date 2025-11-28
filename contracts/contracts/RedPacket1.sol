// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RedPacket1 {
    // --- minimal reentrancy guard ---
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;
    modifier nonReentrant() {
        require(_status != _ENTERED, "reentrant");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    enum PacketType { Fixed, Random }

    struct Packet {
        uint256 id;
        address sender;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 totalCount;
        uint256 remainingCount;
        PacketType packetType;
        uint256 createdAt;
        bool exists;
    }

    struct Claim {
        address claimer;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public nextPacketId;
    Packet[] private allPackets; // 按创建顺序保存，便于列表/分页
    mapping(uint256 => Packet) public packets; // packetId => Packet
    mapping(uint256 => Claim[]) public packetClaims; // packetId => Claim[]
    mapping(address => uint256[]) public packetsBySender; // 地址发过的红包
    mapping(uint256 => mapping(address => bool)) public hasClaimed; // 防重复抢

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

    /// @notice 创建红包
    /// @param packetType 0 = Fixed(等额)，1 = Random(拼手气)
    /// @param totalCount 红包份数
    function createPacket(PacketType packetType, uint256 totalCount) external payable nonReentrant {
        require(msg.value > 0, "no ETH");
        require(totalCount > 0, "count must > 0");

        uint256 packetId = nextPacketId++;

        Packet memory p = Packet({
            id: packetId,
            sender: msg.sender,
            totalAmount: msg.value,
            remainingAmount: msg.value,
            totalCount: totalCount,
            remainingCount: totalCount,
            packetType: packetType,
            createdAt: block.timestamp,
            exists: true
        });

        packets[packetId] = p;
        allPackets.push(p);
        packetsBySender[msg.sender].push(packetId);

        emit PacketCreated(packetId, msg.sender, msg.value, totalCount, packetType);
    }

    /// @notice 抢红包
    function claimPacket(uint256 packetId) external nonReentrant {
        Packet storage p = packets[packetId];
        require(p.exists, "packet not found");
        require(p.remainingCount > 0, "no more");
        require(!hasClaimed[packetId][msg.sender], "claimed");

        uint256 amount = _calcAmount(p);
        p.remainingAmount -= amount;
        p.remainingCount--;
        hasClaimed[packetId][msg.sender] = true;

        packetClaims[packetId].push(Claim(msg.sender, amount, block.timestamp));
        emit PacketClaimed(packetId, msg.sender, amount);

        payable(msg.sender).transfer(amount);

        // 同步 allPackets 的余额/份数，便于列表显示
        allPackets[packetId].remainingAmount = p.remainingAmount;
        allPackets[packetId].remainingCount = p.remainingCount;
    }

    /// @notice 获取单个红包详情
    function getPacket(uint256 packetId) external view returns (Packet memory) {
        return packets[packetId];
    }

    /// @notice 获取红包的领取记录
    function getPacketClaims(uint256 packetId) external view returns (Claim[] memory) {
        return packetClaims[packetId];
    }

    /// @notice 获取某地址发过的红包 ID 列表
    function getPacketsBySender(address sender) external view returns (uint256[] memory) {
        return packetsBySender[sender];
    }

    /// @notice 获取某地址发过的红包详情列表（便于前端直接渲染）
    function getPacketsBySenderDetailed(address sender) external view returns (Packet[] memory) {
        uint256[] memory ids = packetsBySender[sender];
        uint256 len = ids.length;
        Packet[] memory out = new Packet[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = packets[ids[i]];
        }
        return out;
    }

    /// @notice 获取全部红包（小规模场景直接用）
    function getAllPackets() external view returns (Packet[] memory) {
        return allPackets;
    }

    /// @notice 分页获取红包，适合列表展示
    function getPackets(uint256 offset, uint256 limit) external view returns (Packet[] memory) {
        uint256 len = allPackets.length;
        if (offset >= len) return new Packet[](0);
        uint256 end = offset + limit;
        if (end > len) end = len;
        uint256 size = end - offset;
        Packet[] memory page = new Packet[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = allPackets[offset + i];
        }
        return page;
    }

    /// @notice 查询用户是否已领取过某个红包
    function hasUserClaimed(uint256 packetId, address user) external view returns (bool) {
        return hasClaimed[packetId][user];
    }

    // --- internal ---
    function _calcAmount(Packet storage p) internal view returns (uint256 amount) {
        if (p.packetType == PacketType.Fixed) {
            amount = p.totalAmount / p.totalCount;
        } else {
            // 拼手气：剩余金额 * (50%~100%) / 剩余人数，最后一份直接全给
            if (p.remainingCount == 1) return p.remainingAmount;
            uint256 avg = p.remainingAmount / p.remainingCount;
            uint256 min = avg / 2;
            uint256 max = avg;
            uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, p.remainingAmount, p.remainingCount)));
            amount = min + (rand % (max - min + 1));
            if (amount == 0 || amount > p.remainingAmount) amount = avg; // 兜底
        }
    }
}
