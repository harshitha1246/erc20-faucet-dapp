// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFaucetToken {
    function mint(address to, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function MAX_SUPPLY() external view returns (uint256);
}

contract TokenFaucet is ReentrancyGuard {
    IFaucetToken public immutable token;

    uint256 public constant FAUCET_AMOUNT = 100 * 1e18;
    uint256 public constant COOLDOWN_TIME = 24 hours;
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 * 1e18;

    address public admin;
    bool private paused;

    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;

    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetPaused(bool paused);

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Token is zero address");
        token = IFaucetToken(tokenAddress);
        admin = msg.sender;
        paused = false;
    }

    function requestTokens() external nonReentrant {
        require(!paused, "Faucet is paused");
        require(_cooldownPassed(msg.sender), "Cooldown period not elapsed");
        require(totalClaimed[msg.sender] < MAX_CLAIM_AMOUNT, "Lifetime claim limit reached");
        require(remainingAllowance(msg.sender) >= FAUCET_AMOUNT, "Lifetime claim limit reached");
        require(token.totalSupply() + FAUCET_AMOUNT <= token.MAX_SUPPLY(), "Faucet has insufficient token balance");

        lastClaimAt[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += FAUCET_AMOUNT;

        token.mint(msg.sender, FAUCET_AMOUNT);

        emit TokensClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    function canClaim(address user) external view returns (bool) {
        if (paused) return false;
        if (!_cooldownPassed(user)) return false;
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return false;
        return true;
    }

    function remainingAllowance(address user) public view returns (uint256) {
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) {
            return 0;
        }
        return MAX_CLAIM_AMOUNT - totalClaimed[user];
    }

    function setPaused(bool _paused) external {
        require(msg.sender == admin, "Only admin");
        paused = _paused;
        emit FaucetPaused(_paused);
    }

    function isPaused() external view returns (bool) {
        return paused;
    }

    function _cooldownPassed(address user) internal view returns (bool) {
        uint256 last = lastClaimAt[user];
        if (last == 0) return true;
        return block.timestamp >= last + COOLDOWN_TIME;
    }
}
