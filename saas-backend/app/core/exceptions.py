from fastapi import HTTPException, status

class BaseAppException(HTTPException):
    pass

class TenantNotFoundError(BaseAppException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

class AuthenticationError(BaseAppException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

class PermissionDeniedError(BaseAppException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

class RateLimitExceededError(BaseAppException):
    def __init__(self, limit: int, retry_after: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(limit),
                "Retry-After": str(retry_after)
            }
        )

class InvalidSubscriptionError(BaseAppException):
    def __init__(self, detail: str = "Invalid subscription state"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)
