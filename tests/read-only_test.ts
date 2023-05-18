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