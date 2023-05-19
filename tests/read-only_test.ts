import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
import { Pox3 } from "./models/pox-3.ts";

// Tests for various read-only functions

Clarinet.test({
  name: "check-pox-addr-hashbytes: Test PoX address checking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const deployer = accounts.get("deployer")!;

    // Valid PoX addresses
    const poxAddress1 = {
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    };
    const poxAddress2 = {
      version: types.buff(Uint8Array.from([6])),
      hashbytes: types.buff(Uint8Array.from([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))
    };

    // Invalid PoX addresses
    const invalidPoxAddress1 = {
      version: types.buff(Uint8Array.from([8])), // Version to high
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    };
    const invalidPoxAddress2 = {
      version: types.buff(Uint8Array.from([4])), // Too many bytes for version
      hashbytes: types.buff(Uint8Array.from([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))
    };

    chain.callReadOnlyFn('pox-3', 'check-pox-addr-hashbytes', [ poxAddress1.version, poxAddress1.hashbytes ], deployer.address).result.expectBool(true);
    chain.callReadOnlyFn('pox-3', 'check-pox-addr-hashbytes', [ poxAddress2.version, poxAddress2.hashbytes ], deployer.address).result.expectBool(true);
    chain.callReadOnlyFn('pox-3', 'check-pox-addr-hashbytes', [ invalidPoxAddress1.version, invalidPoxAddress1.hashbytes ], deployer.address).result.expectBool(false);
    chain.callReadOnlyFn('pox-3', 'check-pox-addr-hashbytes', [ invalidPoxAddress2.version, invalidPoxAddress2.hashbytes ], deployer.address).result.expectBool(false);
  },
});

Clarinet.test({
  name: "get-num-reward-set-pox-addresses: Test PoX address count",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const pox3 = new Pox3(chain, accounts.get("deployer")!);
    const deployer = accounts.get("deployer")!;
    const sender1 = accounts.get("wallet_1")!;
    const sender2 = accounts.get("wallet_2")!;
    const sender3 = accounts.get("wallet_3")!;

    // Valid PoX addresses
    const poxAddress1 = types.tuple({
      version: types.buff(Uint8Array.from([4])),
      hashbytes: types.buff(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]))
    });
    const poxAddress2 = types.tuple({
      version: types.buff(Uint8Array.from([6])),
      hashbytes: types.buff(Uint8Array.from([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]))
    });

    // Should be zero to start
    chain.callReadOnlyFn('pox-3', 'get-num-reward-set-pox-addresses', [ types.uint(1) ], deployer.address)
      .result
      .expectUint(0);

    // Call `stack-stx` to lock some STX
    let block = chain.mineBlock([
      Tx.contractCall('pox-3', 'stack-stx', [ types.uint(30000), poxAddress1, types.uint(10), types.uint(10) ], sender1.address),
      Tx.contractCall('pox-3', 'stack-stx', [ types.uint(40000), poxAddress2, types.uint(10), types.uint(1) ], sender2.address),
      Tx.contractCall('pox-3', 'stack-stx', [ types.uint(50000), poxAddress2, types.uint(10), types.uint(1) ], sender3.address),
    ]);
    assertEquals(block.receipts.length, 3);
    [0, 1, 2].forEach(i => block.receipts[0].result.expectOk());

    pox3.advanceByFullCycle();

    pox3.stxLockedFromPoxData(sender1.address).result.expectUint(30000);
    pox3.stxLockedFromPoxData(sender2.address).result.expectUint(40000);
    pox3.stxLockedFromPoxData(sender3.address).result.expectUint(50000);

    // We should have one entry for each `stack-stx` call, even if sender/address are the same
    chain.callReadOnlyFn('pox-3', 'get-num-reward-set-pox-addresses', [ types.uint(1) ], deployer.address)
      .result
      .expectUint(3);

    // Check a couple cycles in the future to make sure addresses expire
    chain.callReadOnlyFn('pox-3', 'get-num-reward-set-pox-addresses', [ types.uint(5) ], deployer.address)
      .result
      .expectUint(1);
  },
});
