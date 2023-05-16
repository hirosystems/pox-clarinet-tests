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
  name: "stack-extend: Extend lock duration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialBalance = sender.balance;
    const amountStacked = 50000;
    const initialLockPeriod = 3;
    const extendLockPeriod = 5;
    const increaseBy = 1000;
    const poxAddress = types.tuple({
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    });

    // Call `stack-stx` to lock some STX
    let block = chain.mineBlock([
      Tx.contractCall(
        'pox-3',
        'stack-stx',
        [
          types.uint(amountStacked),
          poxAddress,
          types.uint(10),
          types.uint(initialLockPeriod),
        ],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Check that STX is locked and unlocks at unlock-height
    let account = pox3.stxAccountFromPoxData(sender.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance - amountStacked);
    account.locked.expectUint(amountStacked);
    account['unlock-height'].expectUint(Pox3.REWARD_CYCLE_LENGTH * (1 + initialLockPeriod));

    // Call `stack-increase` to increase the lock amount
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-extend', [ types.uint(extendLockPeriod), poxAddress ], sender.address),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Advance 3 reward cycles
    for (let i=0; i < 3; i++) {
      pox3.advanceByFullCycle();
    }

    // Check that STX is locked and unlocks at unlock-height
    account = pox3.stxAccountFromPoxData(sender.address).result.expectTuple();
    account.unlocked.expectUint(initialBalance - amountStacked);
    account.locked.expectUint(amountStacked);
    account['unlock-height'].expectUint(Pox3.REWARD_CYCLE_LENGTH * (1 + initialLockPeriod + extendLockPeriod));
  },
});

Clarinet.test({
  name: "stack-extend: Trigger error conditions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    let sender = accounts.get("wallet_1")!;
    const initialAmount = 50000;
    const initialLockPeriod = 1;
    const extendLockPeriod = 10;
    const increaseBy = 1000;
    const poxAddress = types.tuple({
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    });

    // Call `stack-stx` to lock some STX
    let block = chain.mineBlock([
      Tx.contractCall(
        'pox-3',
        'stack-stx',
        [
          types.uint(initialAmount),
          poxAddress,
          types.uint(10),
          types.uint(initialLockPeriod),
        ],
        sender.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk();

    // Try to extend before lock
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-extend', [ types.uint(1), poxAddress ], sender.address),
    ]);
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACK_EXTEND_NOT_LOCKED);

    // Advance to next reward cycle
    pox3.advanceByFullCycle();

    // Check that STX is locked
    pox3.stxLockedFromPoxData(sender.address).result.expectUint(initialAmount);

    // Try to extend by 0 or large number
    block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-extend', [ types.uint(0), poxAddress ], sender.address),
      Tx.contractCall('pox-3', 'stack-extend', [ types.uint(20), poxAddress ], sender.address),
    ]);
    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectErr().expectInt(Pox3.ERR_STACKING_INVALID_LOCK_PERIOD);
    block.receipts[1].result.expectErr().expectInt(Pox3.ERR_STACKING_INVALID_LOCK_PERIOD);
  },
});