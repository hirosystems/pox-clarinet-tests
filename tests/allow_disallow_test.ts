import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";
import {
  Account,
  Contract,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet@v1.5.4/index.ts";
Clarinet.test({
  name: "allow-contract-caller: Test allowing an intermediary contract caller for a fixed # of blocks",
  async fn(chain: Chain, accounts: Map<string, Account>, contracts: Map<string, Contract>) {
    const deployer = accounts.get("deployer")!;
    const contractCaller = accounts.get("wallet_1")!;
    const user = accounts.get("wallet_2")!;
    const intermediary = contracts.get(`${deployer.address}.intermediary`)!;
    const pox = contracts.get(`${deployer.address}.pox-3`)!;
    const allowanceExpiration = 100;
    
    // Test 1: Check that the contract caller is allowed when tx-sender == contract-caller
    chain.callReadOnlyFn('pox-3', 'check-caller-allowed', [], deployer.address)
      .result
      .expectBool(true);

    // Test 2: Check that the contract caller is not allowed when tx-sender != contract-caller
    chain.callReadOnlyFn('intermediary', 'check-caller-allowed-proxy', [], deployer.address)
      .result
      .expectErr();

    // Test 2: Allow intermediary to act for deployer
    const allowBlock = chain.mineBlock([
      Tx.contractCall(
        'pox-3',
        'allow-contract-caller',
        [
          types.principal(intermediary.contract_id),
          types.some(types.uint(allowanceExpiration))
        ],
        deployer.address
      ),
    ]);
    allowBlock.receipts[0].result.expectOk();

    // Test 2: Check that the contract is now allowed to act for deployer
    chain.callReadOnlyFn('intermediary', 'check-caller-allowed-proxy', [], deployer.address)
      .result
      .expectOk();
  
    // Check the allowance directly
    chain.callReadOnlyFn(
      'pox-3',
      'get-allowance-contract-callers',
      [
        types.principal(deployer.address),
        types.principal(intermediary.contract_id),
      ],
      deployer.address
    ).result.expectSome().expectTuple()['until-burn-ht'].expectSome().expectUint(allowanceExpiration);

    // Mine until allowance expires
    chain.mineEmptyBlock(allowanceExpiration + 1);

    // Check that allowance has expired
    chain.callReadOnlyFn('intermediary', 'check-caller-allowed-proxy', [], deployer.address)
      .result
      .expectErr();
  },
});
