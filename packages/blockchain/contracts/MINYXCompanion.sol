// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MINYXCompanion
 * @notice ERC-721 NFT avec métadonnées évolutives et option soulbound
 * @dev Architecture NFT dynamique MINYX sur Base L2
 */

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract MINYXCompanion is Ownable {
    string public name = "MINYX Companion";
    string public symbol = "MINYX";

    struct CompanionStats {
        uint8 element;      // 0-6 (Feu, Eau, Ténèbres, Lumière, Terre, Vent, Cosmos)
        uint16 level;       // 1-100
        uint32 xp;          // XP cumulés
        uint16 intelligence;
        uint16 emotion;
        uint16 agility;
        uint16 bond;
        uint8 form;         // 0=Chibi, 1=Éveillé, 2=Évolué, 3=Transcendant, 4=Légendaire
        bool isSoulbound;   // Option lock anti-vente
    }

    uint256 private _nextTokenId;
    address public treasury;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => CompanionStats) public companions;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event CompanionEvolved(uint256 indexed tokenId, uint16 newLevel, uint8 newForm);
    event SoulboundChanged(uint256 indexed tokenId, bool isSoulbound);

    constructor(address _treasury) {
        treasury = _treasury;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: invalid token ID");
        return tokenOwner;
    }

    function balanceOf(address tokenOwner) public view returns (uint256) {
        require(tokenOwner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[tokenOwner];
    }

    function mint(address to, uint8 element, string calldata customURI) external returns (uint256) {
        require(element <= 6, "Invalid element");
        uint256 tokenId = ++_nextTokenId;

        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = customURI;

        companions[tokenId] = CompanionStats({
            element: element,
            level: 1,
            xp: 0,
            intelligence: 10,
            emotion: 10,
            agility: 10,
            bond: 0,
            form: 0,
            isSoulbound: false
        });

        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function evolve(uint256 tokenId, CompanionStats calldata newStats) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        companions[tokenId] = newStats;
        emit CompanionEvolved(tokenId, newStats.level, newStats.form);
    }

    function setSoulbound(uint256 tokenId, bool locked) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        companions[tokenId].isSoulbound = locked;
        emit SoulboundChanged(tokenId, locked);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf(tokenId) == from, "Not owner");
        require(!companions[tokenId].isSoulbound, "Soulbound: non-transferable");
        require(to != address(0), "Transfer to zero address");

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    // ERC-2981 Royalties standard (8%)
    function royaltyInfo(uint256 /* tokenId */, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        return (treasury, (salePrice * 800) / 10000);
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}
