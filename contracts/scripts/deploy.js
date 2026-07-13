// scripts/deploy.js
// Deploys ElectionManager → Voting → links them via setVotingContract()
// Usage:
//   npx hardhat run scripts/deploy.js --network localhost
//   npx hardhat run scripts/deploy.js --network sepolia

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // ── 1. Deploy ElectionManager ──────────────────────────────────────────
  const ElectionManager = await hre.ethers.getContractFactory("ElectionManager");
  const electionManager = await ElectionManager.deploy();
  await electionManager.waitForDeployment();
  const emAddress = await electionManager.getAddress();
  console.log("ElectionManager deployed to:", emAddress);

  // ── 2. Deploy Voting (needs ElectionManager address) ───────────────────
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(emAddress);
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("Voting         deployed to:", votingAddress);

  // ── 3. Link: ElectionManager ↔ Voting ──────────────────────────────────
  const tx = await electionManager.setVotingContract(votingAddress);
  await tx.wait();
  console.log("ElectionManager.setVotingContract() ✔");

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("  Deployment complete!");
  console.log("  ElectionManager :", emAddress);
  console.log("  Voting          :", votingAddress);
  console.log("════════════════════════════════════════════\n");

  // ── Verify on Etherscan (Sepolia only) ─────────────────────────────────
  if (hre.network.name === "sepolia") {
    console.log("Waiting for Etherscan to index the contracts...");
    await voting.deploymentTransaction().wait(5);

    try {
      await hre.run("verify:verify", {
        address: emAddress,
        constructorArguments: [],
      });
      console.log("ElectionManager verified ✔");
    } catch (err) {
      console.log("ElectionManager verification failed:", err.message);
    }

    try {
      await hre.run("verify:verify", {
        address: votingAddress,
        constructorArguments: [emAddress],
      });
      console.log("Voting verified ✔");
    } catch (err) {
      console.log("Voting verification failed:", err.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
