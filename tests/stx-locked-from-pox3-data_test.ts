import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";

Clarinet.test({
  name: "stx-locked-from-pox3-data: Check locked amount after stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const startBurnHeight = 10;
    const lockPeriod = 10;

    let block = chain.mineBlock([
      Tx.contractCall(
        "pox-3",
        "stack-stx",
        [
          types.uint(initialAmount),
          types.tuple({
            version: types.buff(Uint8Array.from([4])),
            hashbytes: types.buff(
              Uint8Array.from([
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
              ])
            ),
          }),
          types.uint(startBurnHeight),
          types.uint(lockPeriod),
        ],
        sender.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Check we are on cycle 0
    let cycle = chain.callReadOnlyFn("pox-3", "current-pox-reward-cycle", [], sender.address)
      .result
      .expectUint(0)

    // Advance to next cycle
    chain.mineEmptyBlockUntil(3000);

    // Check we are on cycle 1
    cycle = chain.callReadOnlyFn("pox-3", "current-pox-reward-cycle", [], sender.address)
      .result
      .expectUint(1)

    // Get PoX info, confirm rejection fraction changed
    let poxInfo = chain.callReadOnlyFn(
        "pox-3",
        "stx-locked-from-pox3-data",
        [
          types.principal(sender.address)
        ],
        sender.address
      )
      .result
      .expectUint(initialAmount)
  },
});