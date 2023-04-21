import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { BuiltIn } from './models/builtin.ts';

Clarinet.test({
  name: "stack-increase: increase STX lock amount",

  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const builtin = new BuiltIn(chain, accounts.get('deployer')!);
    let sender = accounts.get('wallet_1')!;
    const initialAmount = 50000;
    const increaseBy = 1000;

    // Check that the lock amount is 0
    let result = builtin.getSTXAccount(sender.address);
    let position = result.expectOk().expectTuple();
    position['locked'].expectUint(0);

    // Call `stack-stx` to lock some STX
    let block = chain.mineBlock([
      Tx.contractCall('pox-2', 'stack-stx', [types.uint(initialAmount), 
        types.tuple({ version: types.buff(Uint8Array.from([5])), hashbytes: types.buff(Uint8Array.from([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1])) })
      , types.uint(10), types.uint(10)], sender.address)
    ]);
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 3);
    block.receipts[0].result.expectOk();
    
    // Check that the lock amount is initialAmount
    result = builtin.getSTXAccount(sender.address);
    position = result.expectOk().expectTuple();
    position['locked'].expectUint(initialAmount);

    // Call `stack-increase` to increase the lock amount
    block = chain.mineBlock([
      Tx.contractCall('pox-2', 'stack-increase', [types.uint(increaseBy)], sender.address)
    ]);
    
    // Check that the lock amount was increased
    result = builtin.getSTXAccount(sender.address);
    position = result.expectOk().expectTuple();
    position['locked'].expectUint(initialAmount + increaseBy);
    
  },
});
