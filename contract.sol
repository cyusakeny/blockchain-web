// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AutoHashAssetRegistry {
    struct Asset {
        string name;
        bytes32 idHash;
        uint256 cost;
        address owner;
        uint256 registeredAt;
        bool exists;
    }

    mapping(bytes32 => Asset) private assets;
    mapping(address => bytes32[]) private assetsOfOwner;

    event AssetRegistered(bytes32 indexed idHash, address indexed owner, string name, uint256 cost);
    event AssetTransferred(bytes32 indexed idHash, address indexed previousOwner, address indexed newOwner);

    /// @notice Register a new asset — hash is generated automatically
    function registerAsset(string calldata name, uint256 cost) external {
        // Auto-generate hash from sender, name, cost, timestamp
        bytes32 idHash = keccak256(
            abi.encodePacked(msg.sender, name, cost, block.timestamp)
        );
        require(!assets[idHash].exists, "Asset already exists");

        assets[idHash] = Asset({
            name: name,
            idHash: idHash,
            cost: cost,
            owner: msg.sender,
            registeredAt: block.timestamp,
            exists: true
        });

        assetsOfOwner[msg.sender].push(idHash);
        emit AssetRegistered(idHash, msg.sender, name, cost);
    }

    function transferAsset(bytes32 idHash, address newOwner) external {
        require(newOwner != address(0), "new owner cannot be zero");
        Asset storage a = assets[idHash];
        require(a.exists, "Asset not found");
        require(a.owner == msg.sender, "Only owner can transfer");

        address previous = a.owner;
        a.owner = newOwner;

        assetsOfOwner[newOwner].push(idHash);
        emit AssetTransferred(idHash, previous, newOwner);
    }

        function getAsset(bytes32 idHash)
        external
        view
        returns (
            string memory name,
            bytes32 hash,
            uint256 cost,
            address owner,
            uint256 registeredAt,
            bool exists
        )
    {
        Asset storage a = assets[idHash];
        return (a.name, a.idHash, a.cost, a.owner, a.registeredAt, a.exists);
    }


    function getAssetsOf(address ownerAddr) external view returns (bytes32[] memory) {
        return assetsOfOwner[ownerAddr];
    }
}
