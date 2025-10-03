import React, { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Address } from "viem";
import { contractABI } from "../contracts/abi.js";
import { arbitrum } from "wagmi/chains";

// Contract addresses
const CONTRACT_ADDRESS =
  "0x9c713a2ADD0Bc8e676623C3300728A995Ac74eD8" as Address;
const ARB_TOKEN_ADDRESS =
  "0x912CE59144191C1204E64559FE8253a0e49E6548" as Address;

const Admin: React.FC = () => {
  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [depositAmount, setDepositAmount] = useState("");
  const [newClaimAmount, setNewClaimAmount] = useState("");

  const { data: contractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getContractBalance",
    chainId: arbitrum.id,
  }) as { data: bigint | undefined };

  const isOwner =
    address &&
    address.toLowerCase() ===
      "0x21808EE320eDF64c019A6bb0F7E4bFB3d62F06Ec".toLowerCase();

  // Button text state
  const actionText = isPending
    ? "Pending..."
    : isConfirming
    ? "Processing..."
    : isConfirmed
    ? "Done!"
    : "";

  const handleDeposit = async () => {
    const amount = parseUnits(depositAmount, 18);
    await writeContract({
      address: ARB_TOKEN_ADDRESS,
      abi: [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ type: "bool" }],
        },
      ],
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
      chainId: arbitrum.id,
    });
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "deposit",
      args: [amount],
      chainId: arbitrum.id,
    });
    setDepositAmount("");
  };

  const handleWithdraw = async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "withdrawAll",
      chainId: arbitrum.id,
    });
  };

  const handleUpdateClaimAmount = async () => {
    const amount = parseUnits(newClaimAmount, 18);
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "updateClaimAmount",
      args: [amount],
      chainId: arbitrum.id,
    });
    setNewClaimAmount("");
  };

  if (!isConnected) {
    return (
      <div className="text-center text-gray-600 p-6">
        Please connect your wallet to interact with the contract.
      </div>
    );
  }

  return (
    <div className="px-6 text-black text-center">
      <div className="bg-white shadow rounded-xl p-4">
        <p>
          Balance:{" "}
          {contractBalance
            ? `${Number(formatUnits(contractBalance, 18)).toFixed(3)} ARB, for ${Number(formatUnits(contractBalance, 18))/0.025}`
            : "Loading..."}
        </p>
        <div className="flex flex-row gap-3">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="ARB"
            className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleDeposit}
            disabled={!depositAmount || isPending || isConfirming}
            className="w-full py-2 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {actionText || "Deposit"}
          </button>
        </div>
        {isOwner && (
          <div className="mt-3">
            <div className="space-y-2 mt-3">
              <div className="flex flex-row gap-3">
                <input
                  type="number"
                  value={newClaimAmount}
                  onChange={(e) => setNewClaimAmount(e.target.value)}
                  placeholder="New amount"
                  className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
                />
                <button
                  onClick={handleUpdateClaimAmount}
                  disabled={!newClaimAmount || isPending || isConfirming}
                  className="w-full py-2 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {actionText || "Update Amount"}
                </button>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isPending || isConfirming}
                className="w-full py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {actionText || "Withdraw All Tokens"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {writeError && (
        <p className="text-red-500 text-sm mt-4">Error: {writeError.message}</p>
      )}
    </div>
  );
};

export default Admin;
