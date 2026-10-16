"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits } from "viem";

const FEED_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

const feedAbi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function PricePage() {
  const [now, setNow] = useState(Date.now());

  const { data, isPending, error, dataUpdatedAt } = useReadContract({
    address: FEED_ADDRESS,
    abi: feedAbi,
    functionName: "latestRoundData",
    chainId: sepolia.id,
    query: {
      refetchInterval: 15_000,
      retry: 2,
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const answer = data?.[1];
  const updatedAt = data?.[3];
  const ageSeconds = updatedAt
    ? Math.max(0, Math.floor(now / 1000 - Number(updatedAt)))
    : null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Chainlink ETH/USD Price</h1>

      <p className="text-sm text-gray-600">
        Live on Sepolia testnet · Automatically refreshes every 15 seconds
      </p>

      <section className="space-y-3 rounded-xl border p-6">
        <p className="text-sm text-gray-500">Latest reported price</p>

        {isPending && !data ? (
          <p>Loading price from Chainlink...</p>
        ) : error ? (
          <p className="text-red-600">
            Could not load the price. Check your Sepolia RPC configuration.
          </p>
        ) : answer !== undefined && answer > 0n ? (
          <p className="text-4xl font-bold">
            $
            {Number(formatUnits(answer, 8)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : (
          <p>Price is currently unavailable.</p>
        )}

        <p className="text-sm">
          Feed:{" "}
          <a
            className="break-all underline"
            href={`https://sepolia.etherscan.io/address/${FEED_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {FEED_ADDRESS}
          </a>
        </p>

        <p className="text-sm">
          Last on-chain update:{" "}
          {updatedAt && Number(updatedAt) > 0
            ? new Date(Number(updatedAt) * 1000).toLocaleString()
            : "Unavailable"}
        </p>

        <p className="text-sm">
          Age of price:{" "}
          {ageSeconds !== null
            ? `${Math.floor(ageSeconds / 60)}m ${ageSeconds % 60}s`
            : "Unavailable"}
        </p>

        <p className="text-xs text-gray-500">
          Page last fetched:{" "}
          {dataUpdatedAt
            ? new Date(dataUpdatedAt).toLocaleTimeString()
            : "Waiting for first fetch"}
        </p>
      </section>
    </main>
  );
}
