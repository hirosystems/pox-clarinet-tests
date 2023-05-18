
(define-public (check-caller-allowed-proxy)
    (if (contract-call? .pox-3 check-caller-allowed)
        (ok true)
        (err 1)
    )
)