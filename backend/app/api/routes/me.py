"""Authenticated user routes backed by Supabase persistence."""

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.auth import get_current_user
from app.core.config import Settings, get_settings
from app.core.errors import bad_gateway, bad_request, not_found
from app.models.schemas import (
    AuthenticatedUser,
    ClosetItemCreate,
    ClosetItemRecord,
    ClosetItemUpdate,
    DeleteResponse,
    GenerateOutfitsRequest,
    GenerateOutfitsResponse,
    MeResponse,
    ProtectedGenerateOutfitsRequest,
    SavedOutfitCreate,
    SavedOutfitRecord,
)
from app.services.gemini_service import (
    GeminiResponseFormatError,
    GeminiService,
    GeminiServiceError,
    get_gemini_service,
)
from app.services.supabase_service import (
    SupabaseNotFoundError,
    SupabaseService,
    SupabaseServiceError,
    get_supabase_service,
)
from app.utils.file_validation import validate_and_read_files

router = APIRouter(tags=["me"])


@router.get("/me", response_model=MeResponse)
def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> MeResponse:
    try:
        supabase_service.upsert_profile(
            user_id=current_user.user_id,
            display_name=current_user.display_name,
            access_token=current_user.access_token,
        )
        return MeResponse(
            user_id=current_user.user_id,
            email=current_user.email,
            display_name=current_user.display_name,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.get("/me/closet-items", response_model=list[ClosetItemRecord])
def list_closet_items(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> list[ClosetItemRecord]:
    try:
        return supabase_service.list_closet_items(
            user_id=current_user.user_id,
            access_token=current_user.access_token,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.post("/me/closet-items", response_model=ClosetItemRecord)
def create_closet_item(
    payload: ClosetItemCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> ClosetItemRecord:
    try:
        return supabase_service.create_closet_item(
            user_id=current_user.user_id,
            payload=payload,
            access_token=current_user.access_token,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.patch("/me/closet-items/{item_id}", response_model=ClosetItemRecord)
def update_closet_item(
    item_id: str,
    payload: ClosetItemUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> ClosetItemRecord:
    try:
        return supabase_service.update_closet_item(
            user_id=current_user.user_id,
            item_id=item_id,
            payload=payload,
            access_token=current_user.access_token,
        )
    except SupabaseNotFoundError as exc:
        raise not_found(str(exc)) from exc
    except SupabaseServiceError as exc:
        if "No fields provided" in str(exc):
            raise bad_request(str(exc)) from exc
        raise bad_gateway(str(exc)) from exc


@router.delete("/me/closet-items/{item_id}", response_model=DeleteResponse)
def delete_closet_item(
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> DeleteResponse:
    try:
        supabase_service.delete_closet_item(
            user_id=current_user.user_id,
            item_id=item_id,
            access_token=current_user.access_token,
        )
        return DeleteResponse(deleted=True)
    except SupabaseNotFoundError as exc:
        raise not_found(str(exc)) from exc
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.post("/me/closet-items/{item_id}/image", response_model=ClosetItemRecord)
async def upload_closet_item_image(
    item_id: str,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> ClosetItemRecord:
    payloads = await validate_and_read_files(
        [file],
        max_files=1,
        max_upload_bytes=settings.max_upload_bytes,
    )
    payload = payloads[0]
    try:
        return supabase_service.set_closet_item_image(
            user_id=current_user.user_id,
            item_id=item_id,
            content_type=payload.content_type,
            content=payload.data,
            access_token=current_user.access_token,
        )
    except SupabaseNotFoundError as exc:
        raise not_found(str(exc)) from exc
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.delete("/me/closet-items/{item_id}/image", response_model=ClosetItemRecord)
def delete_closet_item_image(
    item_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> ClosetItemRecord:
    try:
        return supabase_service.clear_closet_item_image(
            user_id=current_user.user_id,
            item_id=item_id,
            access_token=current_user.access_token,
        )
    except SupabaseNotFoundError as exc:
        raise not_found(str(exc)) from exc
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.get("/me/saved-outfits", response_model=list[SavedOutfitRecord])
def list_saved_outfits(
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> list[SavedOutfitRecord]:
    try:
        return supabase_service.list_saved_outfits(
            user_id=current_user.user_id,
            access_token=current_user.access_token,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.post("/me/saved-outfits", response_model=SavedOutfitRecord)
def create_saved_outfit(
    payload: SavedOutfitCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> SavedOutfitRecord:
    try:
        return supabase_service.create_saved_outfit(
            user_id=current_user.user_id,
            payload=payload,
            access_token=current_user.access_token,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.delete("/me/saved-outfits/{saved_outfit_id}", response_model=DeleteResponse)
def delete_saved_outfit(
    saved_outfit_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
) -> DeleteResponse:
    try:
        supabase_service.delete_saved_outfit(
            user_id=current_user.user_id,
            saved_outfit_id=saved_outfit_id,
            access_token=current_user.access_token,
        )
        return DeleteResponse(deleted=True)
    except SupabaseNotFoundError as exc:
        raise not_found(str(exc)) from exc
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc


@router.post("/me/generate-outfits", response_model=GenerateOutfitsResponse)
def generate_outfits_from_saved_closet(
    payload: ProtectedGenerateOutfitsRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> GenerateOutfitsResponse:
    try:
        closet_records = supabase_service.list_closet_items(
            user_id=current_user.user_id,
            access_token=current_user.access_token,
        )
    except SupabaseServiceError as exc:
        raise bad_gateway(str(exc)) from exc

    closet_items = SupabaseService.to_generation_closet_items(closet_records)
    if not closet_items:
        raise bad_request("Add at least one closet item before generating outfits.")

    try:
        generated = gemini_service.generate_outfits(
            GenerateOutfitsRequest(
                closet_items=closet_items,
                occasion=payload.occasion,
                itinerary=payload.itinerary,
                preferences=payload.preferences,
            )
        )
    except GeminiResponseFormatError as exc:
        raise bad_gateway(
            "Gemini returned invalid JSON after retry. Please retry your request."
        ) from exc
    except GeminiServiceError as exc:
        raise bad_gateway(str(exc)) from exc

    return GenerateOutfitsResponse(
        occasion=payload.occasion,
        itinerary=payload.itinerary,
        outfits=generated.outfits,
        global_tips=generated.global_tips,
    )
