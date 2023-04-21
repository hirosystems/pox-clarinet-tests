# Clarinet Testing for PoX 

## Run

```
clarinet test --watch
```

## Notes

- `pox-mainnet.clar` constants are hardcoded in to `pox-2.clar`.
- A check in `stack-stx` was comment out to avoid some checks.
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
