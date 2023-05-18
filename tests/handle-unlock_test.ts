import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
import { Pox3 } from "./models/pox-3.ts";

Clarinet.test({
  name: "handle-unlock: Test unlocking STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const sender1 = accounts.get("wallet_1")!;
    const sender2 = accounts.get("wallet_2")!;
    const initialBalance1 = sender1.balance;
    const initialBalance2 = sender2.balance;
    const amountStacked1 = 800000;
    const amountStacked2 = 700000;
    const startBurnHeight = 10;
    const lockPeriod = 10;
    const poxAddress1 = types.tuple({
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    });
    const poxAddress2 = types.tuple({
      version: types.buff(Uint8Array.from([6])),
      hashbytes: types.buff(Uint8Array.from([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))
    });

    let block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-stx', [ types.uint(amountStacked1), poxAddress1, types.uint(startBurnHeight), types.uint(lockPeriod) ], sender1.address),
      Tx.contractCall('pox-3', 'stack-stx', [ types.uint(amountStacked2), poxAddress2, types.uint(startBurnHeight), types.uint(lockPeriod) ], sender2.address),
      Tx.contractCall('pox-3', 'public-handle-unlock', [ types.principal(sender1.address), types.uint(amountStacked1), types.uint(3) ], sender1.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[i].result.expectOk());

    pox3.advanceByFullCycle();

    // Confirm STX is locked
    let account = pox3.stxAccountFromPoxData(sender1.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance1 - amountStacked1);
    account.locked.expectUint(amountStacked1);

    pox3.advanceByFullCycle();
    pox3.advanceByFullCycle();

    // Confirm sender1 STX has been unlocked
    account = pox3.stxAccountFromPoxData(sender1.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance1);
    account.locked.expectUint(0);

    // Confirm sender2 STX still locked
    account = pox3.stxAccountFromPoxData(sender2.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance2 - amountStacked2);
    account.locked.expectUint(amountStacked2);

    // Unlock sender2 STX
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'public-handle-unlock', [ types.principal(sender2.address), types.uint(amountStacked2), types.uint(4) ], sender1.address),
    ]);

    pox3.advanceByFullCycle();
    pox3.advanceByFullCycle();

    // Confirm sender2 STX is unlocked
    account = pox3.stxAccountFromPoxData(sender2.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance2);
    account.locked.expectUint(0);
  },
});