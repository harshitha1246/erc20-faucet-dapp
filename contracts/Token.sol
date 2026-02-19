// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetToken is ERC20, Ownable {
    uint256 public immutable MAX_SUPPLY;
    address public minter;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        address minter_
    ) ERC20(name_, symbol_) {
        require(maxSupply_ > 0, "Max supply must be > 0");
        require(minter_ != address(0), "Minter is zero address");
        MAX_SUPPLY = maxSupply_;
        minter = minter_;
    }

    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Minter is zero address");
        minter = newMinter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}
