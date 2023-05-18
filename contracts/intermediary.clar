
(define-public (check-caller-allowed-proxy)
    (if (contract-call? .pox-3 check-caller-allowed)
        (ok true)
        (err 1)
    )
)

;; This should always return an error
;; This contract cannot grant/revoke permissions for itself
(define-public (disallow-contract-caller (caller principal))
  (contract-call? .pox-3 disallow-contract-caller caller)
)

;; This should always return an error
;; This contract cannot grant/revoke permissions for itself
(define-public (allow-contract-caller (caller principal) (until-burn-ht (optional uint)))
  (contract-call? .pox-3 allow-contract-caller caller until-burn-ht)
)