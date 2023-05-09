import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v1.2.0/index.ts";
  
  class Pox3 {
    // Constants
    public static readonly ERR_STACKING_UNREACHABLE = 255;
    public static readonly ERR_STACKING_CORRUPTED_STATE = 254;
    public static readonly ERR_STACKING_INSUFFICIENT_FUNDS = 1;
    public static readonly ERR_STACKING_INVALID_LOCK_PERIOD = 2;
    public static readonly ERR_STACKING_ALREADY_STACKED = 3;
    public static readonly ERR_STACKING_NO_SUCH_PRINCIPAL = 4;
    public static readonly ERR_STACKING_EXPIRED = 5;
    public static readonly ERR_STACKING_STX_LOCKED = 6;
    public static readonly ERR_STACKING_PERMISSION_DENIED = 9;
    public static readonly ERR_STACKING_THRESHOLD_NOT_MET = 11;
    public static readonly ERR_STACKING_POX_ADDRESS_IN_USE = 12;
    public static readonly ERR_STACKING_INVALID_POX_ADDRESS = 13;
    public static readonly ERR_STACKING_ALREADY_REJECTED = 17;
    public static readonly ERR_STACKING_INVALID_AMOUNT = 18;
    public static readonly ERR_NOT_ALLOWED = 19;
    public static readonly ERR_STACKING_ALREADY_DELEGATED = 20;
    public static readonly ERR_DELEGATION_EXPIRES_DURING_LOCK = 21;
    public static readonly ERR_DELEGATION_TOO_MUCH_LOCKED = 22;
    public static readonly ERR_DELEGATION_POX_ADDR_REQUIRED = 23;
    public static readonly ERR_INVALID_START_BURN_HEIGHT = 24;
    public static readonly ERR_NOT_CURRENT_STACKER = 25;
    public static readonly ERR_STACK_EXTEND_NOT_LOCKED = 26;
    public static readonly ERR_STACK_INCREASE_NOT_LOCKED = 27;
    public static readonly ERR_DELEGATION_NO_REWARD_SLOT = 28;
    public static readonly ERR_DELEGATION_WRONG_REWARD_SLOT = 29;
    public static readonly ERR_STACKING_IS_DELEGATED = 30;
    public static readonly ERR_STACKING_NOT_DELEGATED = 31;

    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
  
    // NOTE: `stx-account` function doesn't seem to work with current (1.5.4) version of Clarinet
    //        Use `stx-locked-from-pox3-data` instead
    stxLockedFromPox3Data(accountAddress: string) {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "stx-locked-from-pox3-data",
        [
            types.principal(accountAddress)
        ],
        this.deployer.address
      );
    }

    stxAccountFromPox3Data(accountAddress: string) {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "stx-account-from-pox3-data",
        [
            types.principal(accountAddress)
        ],
        this.deployer.addres
      );
    }

    currentPoxRewardCycle() {
      return this.chain.callReadOnlyFn(
        "pox-3",
        "current-pox-reward-cycle",
        [],
        this.deployer.address
      );
    }
  }  

  export { Pox3 };