"""Authentication dependencies for protected API routes."""

from fastapi import Depends, Header

from app.core.errors import unauthorized
from app.models.schemas import AuthenticatedUser
from app.services.supabase_service import (
    SupabaseAuthError,
    SupabaseService,
    SupabaseServiceError,
    get_supabase_service,
)


def get_current_user(
    authorization: str | None = Header(default=None),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> AuthenticatedUser:
    if not authorization:
        raise unauthorized("Authorization header is required.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized("Authorization header must be Bearer <token>.")

    try:
        user = supabase_service.validate_access_token(token)
        return user.model_copy(update={"access_token": token})
    except SupabaseAuthError as exc:
        raise unauthorized(str(exc)) from exc
    except SupabaseServiceError as exc:
        raise unauthorized(f"Auth service unavailable: {exc}") from exc
