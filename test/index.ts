import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Dice__factory, Dice } from "../typechain";

describe("Dice game", function () {
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let contract: Dice;
  beforeEach(async function () {
    [deployer, addr1] = await ethers.getSigners();
    contract = await new Dice__factory(deployer).deploy();
  });

  it("Should return admin", async function () {
    [deployer] = await ethers.getSigners();
    const owner = await contract.admin();
    expect(owner).to.equal(deployer.address);
  });

  it("Only owner can withdraw the balance", async () => {
    await deployer.sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther("1.0"),
    });

    expect(await contract.getContractBalance()).to.equal(
      ethers.utils.parseEther("1.0")
    );

    await expect(
      contract.connect(addr1).withdraw(ethers.utils.parseEther("0.5"))
    ).to.be.reverted;
    await expect(contract.connect(addr1).withdrawAll()).to.be.reverted;

    await contract.connect(deployer).withdraw(ethers.utils.parseEther("0.5"));

    expect(await contract.getContractBalance()).to.be.equal(
      ethers.utils.parseEther("0.5")
    );
    await contract.connect(deployer).withdrawAll();

    expect(await contract.getContractBalance()).to.be.equal("0");
  });

  it("Only owner can change the maxBetAmount and minBetAmount", async () => {
    const newMax = ethers.utils.parseEther("200");
    const newMin = ethers.utils.parseEther("20");
    await expect(contract.connect(addr1).setMaxBetAmount(newMax)).to.be
      .reverted;
    await expect(contract.connect(addr1).setMinBetAmount(newMin)).to.be
      .reverted;
    await contract.connect(deployer).setMaxBetAmount(newMax);
    await contract.connect(deployer).setMinBetAmount(newMin);
    expect(ethers.utils.formatEther(await contract.maxBetAmount())).to.be.equal(
      "200.0"
    );
    expect(ethers.utils.formatEther(await contract.minBetAmount())).to.be.equal(
      "20.0"
    );
  });

  it("Only owner can change the margin", async () => {
    await expect(contract.connect(addr1).setMargin("10")).to.be.reverted;
    await contract.connect(deployer).setMargin("10");
    expect(await contract.margin()).to.be.equal("10");
  });

  it("rollDice function", async () => {
    await deployer.sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther("500"),
    });
    await contract
      .connect(deployer)
      .setMaxBetAmount(ethers.utils.parseEther("200"));

    const provider = waffle.provider;

    const options = { value: ethers.utils.parseEther("100") };
    const tx = await contract.connect(addr1).rollDice(true, options);
    const receipt = await tx.wait();
    // @ts-ignore
    for (const event of receipt.events) {
      if (event.event === "BetResult") {
        // @ts-ignore
        const isWin = event?.args[0] as boolean;
        // console.log("event?.args", event?.args);
        // console.log("isWin", isWin);
        const addr1Bal = await provider.getBalance(addr1.address);
        if (isWin === true) {
          expect(Number(ethers.utils.formatEther(addr1Bal))).to.be.greaterThan(
            10092
          );
        } else {
          expect(Number(ethers.utils.formatEther(addr1Bal))).to.be.lessThan(
            9900
          );
        }
      }
    }
  });
});
