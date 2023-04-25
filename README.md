# Clarinet Testing for PoX 

## *DISCLAIMER*: because in this repo we are testing a standalone version of PoX some functionality might be missing or limit. For example the locked/unlocked balance of STX is not updated by the standalone PoX contract because these balances are updated by the blockchain node and stored outside of the PoX smart contract.

## Run

```
clarinet test --watch
```

## Notes

- `pox-mainnet.clar` constants are hardcoded in to `pox-2.clar`.
- A check in `stack-stx` was comment out to avoid some complex checks for hashbytes.
```
;;DEBUG (try! (can-stack-stx pox-addr amount-ustx first-reward-cycle lock-period))
```
- There is a bug in builtin Clarity functions (https://github.com/hirosystems/clarinet/pull/714), when called from Clarinet 1.2.0, it was addressed in Clarinet 1.3.0 but is still happening
```
Readonly Contract call runtime error: pox-2::stack-increase(u1000) -> 
 Runtime Error: Runtime error while interpreting ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK.contract-call:
   Unchecked(CostComputationFailed("Error evaluating result of cost function ST000000000000000000002AMW42H.costs.cost_stx_account: 
    Unchecked(UndefinedFunction(\"cost_stx_account\"))"))
```

## Functions

B: Basic tests

```clarity
B (define-public (set-burnchain-parameters (first-burn-height uint)
(define-public (disallow-contract-caller (caller principal))
(define-public (allow-contract-caller (caller principal) (until-burn-ht (optional uint)))
B (define-public (stack-stx (amount-ustx uint)
B (define-public (revoke-delegate-stx)
B (define-public (delegate-stx (amount-ustx uint)
(define-public (stack-aggregation-commit (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (stack-aggregation-commit-indexed (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (stack-aggregation-increase (pox-addr { version: (buff 1), hashbytes: (buff 32) })
(define-public (delegate-stack-stx (stacker principal)
(define-public (reject-pox)
B (define-public (stack-increase (increase-by uint))
(define-public (stack-extend (extend-count uint)
(define-public (delegate-stack-increase
(define-public (delegate-stack-extend
```

