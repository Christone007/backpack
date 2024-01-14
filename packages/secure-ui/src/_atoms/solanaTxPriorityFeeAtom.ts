import { BACKEND_API_URL } from "@coral-xyz/common";
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Transaction,
  type TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { selectorFamily } from "recoil";

import { solanaTransactionAtom } from "./solanaTransactionAtom";
const DEFAULT_COMPUTE_UNIT_LIMIT = 200_000;

export const solanaTxPriorityFeeAtom = selectorFamily<
  {
    computeUnits: number;
    priorityFee: BigInt;
  },
  {
    tx: string;
  }
>({
  key: "solanaTxPriorityFeeAtom",
  get:
    (request) =>
    async ({ get }) => {
      const transaction = get(solanaTransactionAtom(request));
      const config = {
        computeUnits: DEFAULT_COMPUTE_UNIT_LIMIT,
        priorityFee: BigInt(0),
      };

      try {
        let ixs: TransactionInstruction[] = [];
        let isLegacy = false;
        if (transaction instanceof Transaction) {
          ixs = transaction.instructions;
          isLegacy = true;
        } else {
          ixs = TransactionMessage.decompile(transaction.message).instructions;
          isLegacy = transaction.version === "legacy";
        }

        // or there could be signers
        if (isLegacy) {
          // TODO: re-enable this query when fees are being turned back on
          // const dynamicMicroLamports = await _getPriorityFee(request.tx);
          // config.priorityFee = BigInt(dynamicMicroLamports);

          ixs.forEach((ix) => {
            if (ix.programId.equals(ComputeBudgetProgram.programId)) {
              // SetComputeUnitLimit parsing
              try {
                const decodedUnits =
                  ComputeBudgetInstruction.decodeSetComputeUnitLimit(ix);
                config.computeUnits = decodedUnits.units;
              } catch {
                // NOOP
              }
              // SetComputeUnitPrice parsing
              try {
                const decodedParams =
                  ComputeBudgetInstruction.decodeSetComputeUnitPrice(ix);
                config.priorityFee = BigInt(decodedParams.microLamports);
              } catch {
                // NOOP
              }
            }
          });
        }
      } catch (err: any) {
        console.error(
          "failed to calculate transaction priority fee",
          err.message
        );
      }

      return config;
    },
});

/**
 * Query for the suggested micro-lamport amount to set
 * as the unit price for the priority fee assignment of a transaction.
 * @param {string} transaction
 * @returns {Promise<number>}
 */
async function _getPriorityFee(transaction: string): Promise<number> {
  try {
    const resp = await fetch(`${BACKEND_API_URL}/v2/graphql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query GetSolanaPriorityFee($transaction: String!) {
          solanaPriorityFeeEstimate(transaction: $transaction)
        }
      `,
        variables: {
          transaction,
        },
        operationName: "GetSolanaPriorityFee",
      }),
    });

    const json = await resp.json();
    return json.data?.solanaPriorityFeeEstimate ?? 0;
  } catch {
    return 0;
  }
}
