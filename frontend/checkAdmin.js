const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const contractAddress = "0x41f46B902383e664FE01febB9E090fbAd3462c19";
const abi = [
  "function owner() view returns (address)",
  "function admins(address) view returns (bool)"
];
const contract = new ethers.Contract(contractAddress, abi, provider);

async function main() {
  try {
    console.log("Checking contract on Sepolia:", contractAddress);
    const owner = await contract.owner();
    console.log("Owner is:", owner);
    
    const target = "0x017EAD9D9cC53DCaf3d9774d3BA25492E5f01886";
    const isAdmin = await contract.admins(target);
    console.log(`Is ${target} an admin?`, isAdmin);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
