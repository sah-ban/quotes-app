import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { formatUnits, Address, parseEther, Hash } from "viem";
import { contractABI } from "../contracts/abi.js";
import { base } from "wagmi/chains";

// Contract addresses
const CONTRACT_ADDRESS =
  "0xf594d97EE2b6a3B51a8EF97Cfce4AAE04418B70C" as Address;
const TOKEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" as Address;

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
  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined);
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { data: contractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: "getContractTokenBalance",
    chainId: base.id,
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
    await writeContract(
      {
        address: TOKEN_ADDRESS,
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
        args: [CONTRACT_ADDRESS, parseEther(depositAmount)],
        chainId: base.id,
      },
      {
        onSuccess: (hash: Hash) => {
          setApproveHash(hash);
        },
      }
    );
  };

  useEffect(() => {
    if (isApproved && depositAmount) {
      const deposit = async () => {
        try {
          await writeContract({
            address: CONTRACT_ADDRESS,
            abi: contractABI,
            functionName: "depositTokens",
            args: [parseEther(depositAmount)],
            chainId: base.id,
          });
          setDepositAmount("");
          setApproveHash(undefined);
        } catch (error) {
          console.error("Deposit tokens failed:", error);
        }
      };
      deposit();
    }
  }, [isApproved, depositAmount, writeContract]);

  const handleWithdraw = async () => {
    await writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: "withdrawAll",
      chainId: base.id,
    });
  };

  const { data: balance } = useBalance({
    address,
    token: TOKEN_ADDRESS,
    chainId: base.id,
  });

  if (!isConnected) {
    return (
      <div className="text-center text-gray-600 p-6">
        Please connect your wallet to interact with the contract.
      </div>
    );
  }

  return (
    <div className="px-6 text-black text-center">
      <div className="bg-white shadow rounded-xl p-2">
        <p className="text-base">
          Vault :{" "}
          {contractBalance && balance ? (
            <>
              <strong>
                {Number(formatUnits(contractBalance, 18)).toFixed(2)}
              </strong>
              , wallet:{" "}
              <strong>
                {Number(formatUnits(balance.value, 18)).toFixed(2)}
              </strong>
            </>
          ) : (
            "Loading..."
          )}
        </p>

        <div className="flex flex-row gap-3">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="DEGEN"
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
