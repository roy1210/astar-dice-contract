//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Dice is Ownable {
    using SafeMath for uint256;

    string private seed;
    uint256 private nonce;
    address payable public admin;
    uint256 public maxBetAmount;
    uint256 public minBetAmount;
    uint256 public margin;
    uint256 public upSideFrom;

    event Received(address, uint256);

    event BetResult(
        bool isWin,
        uint256 diceAmount,
        uint256 dice1,
        uint256 dice2,
        uint256 dice3,
        uint256 betAmount,
        uint256 winningPrise
    );

    constructor() {
        admin = payable(msg.sender);
        nonce = 0;
        maxBetAmount = 50000000000000000000;
        minBetAmount = 1000000000000000000;
        seed = "seed";
        margin = 7;
        upSideFrom = 11;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function setSeed(string memory _value) public onlyOwner {
        seed = _value;
    }

    function setUpsideFrom(uint256 _number) public onlyOwner {
        upSideFrom = _number;
    }

    function withdraw(uint256 _amount) external payable onlyOwner {
        admin.transfer(_amount);
    }

    function withdrawAll() external payable onlyOwner {
        admin.transfer(address(this).balance);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function setMaxBetAmount(uint256 _value) public onlyOwner {
        maxBetAmount = _value;
    }

    function setMinBetAmount(uint256 _value) public onlyOwner {
        minBetAmount = _value;
    }

    function setMargin(uint256 _value) public onlyOwner {
        margin = _value;
    }

    function randNumber(uint256 maxRandom) internal returns (uint256) {
        nonce = nonce.add(1);
        bytes32 previousHash = blockhash(block.number - 1);
        bytes32 salt = keccak256(
            abi.encode(seed, nonce, block.difficulty, block.timestamp)
        );

        return
            uint256(keccak256(abi.encode(nonce, previousHash, salt))) %
            maxRandom;
    }

    function calculateMargin(uint256 _amount) public view returns (uint256) {
        require((_amount / 10000) * 10000 == _amount, "too small");
        return (_amount * (margin * 100)) / 10000;
    }

    function calculatePrize(uint256 _amount) public view returns (uint256) {
        return _amount * 2 - calculateMargin(_amount);
    }

    function rollDice(bool _isUpSide) public payable {
        bool isWin = false;
        uint256 amount = msg.value;
        uint256 contractBal = getContractBalance();
        require(maxBetAmount > amount, "Invalid amount");
        require(
            contractBal - 1000000000000000000 > amount * 2,
            "Shortage in the contract balance"
        );
        payable(address(this)).transfer(amount);
        uint256 dice1 = randNumber(6) + 1;
        uint256 dice2 = randNumber(6) + 1;
        uint256 dice3 = randNumber(6) + 1;
        uint256 diceAmount = dice1 + dice2 + dice3;
        uint256 winningPrise = calculatePrize(amount);

        if (diceAmount >= upSideFrom) {
            if (_isUpSide) {
                isWin = true;
                payable(msg.sender).transfer(winningPrise);
            }
        } else {
            if (!_isUpSide) {
                isWin = true;
                payable(msg.sender).transfer(winningPrise);
            }
        }

        uint256 prise = isWin ? winningPrise : 0;
        emit BetResult(isWin, diceAmount, dice1, dice2, dice3, amount, prise);
    }
}
