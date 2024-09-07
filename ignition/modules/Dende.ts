import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DENDE_TOKEN = "0x9D454e940d1fa99746E7edb96dCe84725c70446C";
const DENDE_VAULT_CONTRACT_ADDRESS = "0x63c776f33769e29a82C5A6e948AA8133a0323817";

const DendeModule = buildModule("DendeModule", (m) => {
  const DendeVault = m.contract("DendeVault", [DENDE_TOKEN, 150], {})
  return { DendeVault };
});

export default DendeModule;