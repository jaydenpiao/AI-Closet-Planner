"""Supabase auth, PostgREST, and Storage helpers for authenticated APIs."""

from __future__ import annotations

import mimetypes
from urllib.parse import quote

import httpx
from fastapi import Depends

from app.core.config import Settings, get_settings
from app.models.schemas import (
    AuthenticatedUser,
    ClosetItem,
    ClosetItemCreate,
    ClosetItemRecord,
    ClosetItemUpdate,
    SavedOutfitCreate,
    SavedOutfitRecord,
)


class SupabaseServiceError(Exception):
    """Base exception for Supabase integration errors."""


class SupabaseAuthError(SupabaseServiceError):
    """Raised when user auth verification fails."""


class SupabaseNotFoundError(SupabaseServiceError):
    """Raised when expected rows are missing."""


class SupabaseService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.supabase_url = (settings.supabase_url or "").rstrip("/")
        self.publishable_key = settings.supabase_publishable_key or ""
        self.service_role_key = settings.supabase_service_role_key or ""
        self.storage_bucket = settings.supabase_storage_bucket

        if not self.supabase_url:
            raise SupabaseServiceError("SUPABASE_URL is required for authenticated APIs.")
        if not self.publishable_key:
            raise SupabaseServiceError(
                "SUPABASE_PUBLISHABLE_KEY is required for authenticated APIs."
            )

        self._client = httpx.Client(timeout=30)

    def _data_headers(self, *, access_token: str | None = None) -> dict[str, str]:
        if self.service_role_key:
            return {
                "apikey": self.service_role_key,
                "Authorization": f"Bearer {self.service_role_key}",
            }
        if access_token:
            return {
                "apikey": self.publishable_key,
                "Authorization": f"Bearer {access_token}",
            }
        raise SupabaseServiceError(
            "No data-access auth available. Set SUPABASE_SERVICE_ROLE_KEY or provide user access token."
        )

    def validate_access_token(self, access_token: str) -> AuthenticatedUser:
        response = self._client.get(
            f"{self.supabase_url}/auth/v1/user",
            headers={
                "apikey": self.publishable_key,
                "Authorization": f"Bearer {access_token}",
            },
        )
        if response.status_code >= 400:
            raise SupabaseAuthError("Invalid or expired Supabase session token.")

        payload = response.json()
        user_id = payload.get("id")
        if not user_id:
            raise SupabaseAuthError("Supabase user payload was missing id.")

        metadata = payload.get("user_metadata") or {}
        display_name = metadata.get("full_name") or metadata.get("name")
        return AuthenticatedUser(
            user_id=user_id,
            email=payload.get("email"),
            display_name=display_name,
        )

    def upsert_profile(
        self,
        *,
        user_id: str,
        display_name: str | None,
        access_token: str | None = None,
    ) -> None:
        payload = {
            "user_id": user_id,
            "display_name": display_name,
        }
        self._request_rest(
            "POST",
            "profiles",
            params={"on_conflict": "user_id"},
            json=payload,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
            access_token=access_token,
        )

    def list_closet_items(
        self,
        *,
        user_id: str,
        access_token: str | None = None,
    ) -> list[ClosetItemRecord]:
        rows = self._request_rest(
            "GET",
            "closet_items",
            params={
                "select": "*",
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
            },
            access_token=access_token,
        )
        records = [self._row_to_closet_item_record(row) for row in (rows or [])]
        return self._attach_signed_urls(records, access_token=access_token)

    def get_closet_item(
        self,
        *,
        user_id: str,
        item_id: str,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        rows = self._request_rest(
            "GET",
            "closet_items",
            params={
                "select": "*",
                "id": f"eq.{item_id}",
                "user_id": f"eq.{user_id}",
                "limit": "1",
            },
            access_token=access_token,
        )
        if not rows:
            raise SupabaseNotFoundError("Closet item not found.")
        return self._attach_signed_urls(
            [self._row_to_closet_item_record(rows[0])],
            access_token=access_token,
        )[0]

    def create_closet_item(
        self,
        *,
        user_id: str,
        payload: ClosetItemCreate,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        insert_payload = {
            "user_id": user_id,
            "name": payload.name,
            "category": payload.category.value,
            "color": payload.color,
            "material": payload.material,
            "pattern": payload.pattern,
            "formality": payload.formality.value,
            "seasonality": [value.value for value in payload.seasonality],
            "tags": payload.tags,
            "notes": payload.notes,
        }
        rows = self._request_rest(
            "POST",
            "closet_items",
            json=insert_payload,
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        return self._attach_signed_urls(
            [self._row_to_closet_item_record(rows[0])],
            access_token=access_token,
        )[0]

    def update_closet_item(
        self,
        *,
        user_id: str,
        item_id: str,
        payload: ClosetItemUpdate,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        update_payload: dict[str, object] = {}
        if payload.name is not None:
            update_payload["name"] = payload.name
        if payload.category is not None:
            update_payload["category"] = payload.category.value
        if payload.color is not None:
            update_payload["color"] = payload.color
        if payload.material is not None:
            update_payload["material"] = payload.material
        if payload.pattern is not None:
            update_payload["pattern"] = payload.pattern
        if payload.formality is not None:
            update_payload["formality"] = payload.formality.value
        if payload.seasonality is not None:
            update_payload["seasonality"] = [value.value for value in payload.seasonality]
        if payload.tags is not None:
            update_payload["tags"] = payload.tags
        if payload.notes is not None:
            update_payload["notes"] = payload.notes

        if not update_payload:
            raise SupabaseServiceError("No fields provided for closet item update.")

        rows = self._request_rest(
            "PATCH",
            "closet_items",
            params={
                "id": f"eq.{item_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
            },
            json=update_payload,
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        if not rows:
            raise SupabaseNotFoundError("Closet item not found.")
        return self._attach_signed_urls(
            [self._row_to_closet_item_record(rows[0])],
            access_token=access_token,
        )[0]

    def delete_closet_item(
        self,
        *,
        user_id: str,
        item_id: str,
        access_token: str | None = None,
    ) -> None:
        item = self.get_closet_item(user_id=user_id, item_id=item_id, access_token=access_token)
        self._request_rest(
            "DELETE",
            "closet_items",
            params={
                "id": f"eq.{item_id}",
                "user_id": f"eq.{user_id}",
                "select": "id",
            },
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        if item.image_path:
            self.delete_storage_object(path=item.image_path, access_token=access_token)

    def set_closet_item_image(
        self,
        *,
        user_id: str,
        item_id: str,
        content_type: str,
        content: bytes,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        item = self.get_closet_item(
            user_id=user_id,
            item_id=item_id,
            access_token=access_token,
        )
        extension = mimetypes.guess_extension(content_type) or ".jpg"
        image_path = f"{user_id}/{item_id}/primary{extension}"
        self.upload_storage_object(
            path=image_path,
            content=content,
            content_type=content_type,
            access_token=access_token,
        )

        rows = self._request_rest(
            "PATCH",
            "closet_items",
            params={
                "id": f"eq.{item_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
            },
            json={"image_path": image_path, "image_mime_type": content_type},
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        if not rows:
            raise SupabaseNotFoundError("Closet item not found.")

        if item.image_path and item.image_path != image_path:
            self.delete_storage_object(path=item.image_path, access_token=access_token)
        return self._attach_signed_urls(
            [self._row_to_closet_item_record(rows[0])],
            access_token=access_token,
        )[0]

    def clear_closet_item_image(
        self,
        *,
        user_id: str,
        item_id: str,
        access_token: str | None = None,
    ) -> ClosetItemRecord:
        item = self.get_closet_item(
            user_id=user_id,
            item_id=item_id,
            access_token=access_token,
        )
        if item.image_path:
            self.delete_storage_object(path=item.image_path, access_token=access_token)

        rows = self._request_rest(
            "PATCH",
            "closet_items",
            params={
                "id": f"eq.{item_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
            },
            json={"image_path": None, "image_mime_type": None},
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        if not rows:
            raise SupabaseNotFoundError("Closet item not found.")
        return self._attach_signed_urls(
            [self._row_to_closet_item_record(rows[0])],
            access_token=access_token,
        )[0]

    def list_saved_outfits(
        self,
        *,
        user_id: str,
        access_token: str | None = None,
    ) -> list[SavedOutfitRecord]:
        rows = self._request_rest(
            "GET",
            "saved_outfits",
            params={
                "select": "*",
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
            },
            access_token=access_token,
        )
        return [SavedOutfitRecord.model_validate(row) for row in (rows or [])]

    def create_saved_outfit(
        self,
        *,
        user_id: str,
        payload: SavedOutfitCreate,
        access_token: str | None = None,
    ) -> SavedOutfitRecord:
        rows = self._request_rest(
            "POST",
            "saved_outfits",
            json={
                "user_id": user_id,
                "title": payload.title,
                "occasion": payload.occasion,
                "itinerary": payload.itinerary,
                "outfit_snapshot": payload.outfit_snapshot.model_dump(mode="json"),
                "global_tips": payload.global_tips,
            },
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        return SavedOutfitRecord.model_validate(rows[0])

    def delete_saved_outfit(
        self,
        *,
        user_id: str,
        saved_outfit_id: str,
        access_token: str | None = None,
    ) -> None:
        rows = self._request_rest(
            "DELETE",
            "saved_outfits",
            params={
                "id": f"eq.{saved_outfit_id}",
                "user_id": f"eq.{user_id}",
                "select": "id",
            },
            headers={"Prefer": "return=representation"},
            access_token=access_token,
        )
        if not rows:
            raise SupabaseNotFoundError("Saved outfit not found.")

    @staticmethod
    def to_generation_closet_items(items: list[ClosetItemRecord]) -> list[ClosetItem]:
        return [
            ClosetItem(
                id=item.id,
                name=item.name,
                category=item.category,
                color=item.color,
                material=item.material,
                pattern=item.pattern,
                formality=item.formality,
                seasonality=item.seasonality,
                tags=item.tags,
                notes=item.notes,
            )
            for item in items
        ]

    def upload_storage_object(
        self,
        *,
        path: str,
        content: bytes,
        content_type: str,
        access_token: str | None = None,
    ) -> None:
        response = self._client.post(
            f"{self.supabase_url}/storage/v1/object/{self.storage_bucket}/{quote(path, safe='/')}",
            headers={
                **self._data_headers(access_token=access_token),
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            content=content,
        )
        if response.status_code >= 400:
            raise SupabaseServiceError(
                f"Supabase storage upload failed ({response.status_code}): {response.text}"
            )

    def delete_storage_object(self, *, path: str, access_token: str | None = None) -> None:
        response = self._client.delete(
            f"{self.supabase_url}/storage/v1/object/{self.storage_bucket}/{quote(path, safe='/')}",
            headers=self._data_headers(access_token=access_token),
        )
        # Ignore missing objects on delete, but raise on other storage failures.
        if response.status_code >= 400 and response.status_code != 404:
            raise SupabaseServiceError(
                f"Supabase storage delete failed ({response.status_code}): {response.text}"
            )

    def create_signed_storage_url(
        self,
        *,
        path: str,
        expires_in: int = 3600,
        access_token: str | None = None,
    ) -> str:
        response = self._client.post(
            f"{self.supabase_url}/storage/v1/object/sign/{self.storage_bucket}/{quote(path, safe='/')}",
            headers={
                **self._data_headers(access_token=access_token),
                "Content-Type": "application/json",
            },
            json={"expiresIn": expires_in},
        )
        if response.status_code >= 400:
            raise SupabaseServiceError(
                f"Supabase signed URL generation failed ({response.status_code}): {response.text}"
            )
        data = response.json()
        signed_url = data.get("signedURL") or data.get("signedUrl")
        if not signed_url:
            raise SupabaseServiceError("Supabase signed URL response missing signedURL.")
        if signed_url.startswith("http"):
            return signed_url
        return f"{self.supabase_url}{signed_url}"

    def _attach_signed_urls(
        self,
        items: list[ClosetItemRecord],
        *,
        access_token: str | None = None,
    ) -> list[ClosetItemRecord]:
        records: list[ClosetItemRecord] = []
        for item in items:
            if item.image_path:
                image_url = self.create_signed_storage_url(
                    path=item.image_path,
                    access_token=access_token,
                )
                records.append(item.model_copy(update={"image_url": image_url}))
            else:
                records.append(item)
        return records

    @staticmethod
    def _row_to_closet_item_record(row: dict) -> ClosetItemRecord:
        return ClosetItemRecord.model_validate(
            {
                **row,
                "tags": row.get("tags") or [],
                "seasonality": row.get("seasonality") or [],
            }
        )

    def _request_rest(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json: dict | None = None,
        headers: dict[str, str] | None = None,
        access_token: str | None = None,
    ):
        request_headers = dict(self._data_headers(access_token=access_token))
        if headers:
            request_headers.update(headers)

        response = self._client.request(
            method,
            f"{self.supabase_url}/rest/v1/{table}",
            params=params,
            json=json,
            headers=request_headers,
        )
        if response.status_code >= 400:
            raise SupabaseServiceError(
                f"Supabase REST request failed ({response.status_code}): {response.text}"
            )
        if not response.text:
            return None
        return response.json()


def get_supabase_service(settings: Settings = Depends(get_settings)) -> SupabaseService:
    return SupabaseService(settings)
