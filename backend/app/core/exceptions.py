"""Custom exception hierarchy."""


class SoukSyncError(Exception):
    """Base exception for all SoukSync errors."""

    def __init__(self, message: str = "An error occurred", status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(SoukSyncError):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(message=f"{resource} not found", status_code=404)


class UnauthorizedError(SoukSyncError):
    def __init__(self, message: str = "Not authenticated") -> None:
        super().__init__(message=message, status_code=401)


class ForbiddenError(SoukSyncError):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message=message, status_code=403)


class ValidationError(SoukSyncError):
    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(message=message, status_code=422)
