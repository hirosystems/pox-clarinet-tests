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
    const sender = accounts.get("wallet_1")!;
    const initialBalance = sender.balance;
    const amountStacked = 800000;
    const startBurnHeight = 10;
    const lockPeriod = 10;
    const poxAddress = types.tuple({
      version: types.buff(Uint8Array.from([6])),
      hashbytes: types.buff(Uint8Array.from([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))
    });

    let block = chain.mineBlock([
      Tx.contractCall(
        'pox-3',
        'stack-stx',
        [
          types.uint(amountStacked),
          poxAddress,
          types.uint(startBurnHeight),
          types.uint(lockPeriod),
        ],
        sender.address
      ),
      Tx.contractCall(
        'pox-3',
        'public-handle-unlock',
        [
          types.principal(sender.address),
          types.uint(amountStacked),
          types.uint(3),
        ],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();

    pox3.advanceByFullCycle();

    // Confirm STX is locked
    let account = pox3.stxAccountFromPoxData(sender.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance - amountStacked);
    account.locked.expectUint(amountStacked);

    pox3.advanceByFullCycle();
    pox3.advanceByFullCycle();

    // Confirm STX has been unlocked
    account = pox3.stxAccountFromPoxData(sender.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance);
    account.locked.expectUint(0);
  },
});