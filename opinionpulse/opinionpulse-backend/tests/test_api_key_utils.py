"""Tests for API key placeholder detection."""

from app.services.api_key_utils import is_valid_api_key


def test_rejects_placeholder_keys():
    assert is_valid_api_key("your_newsapi_key_here") is False
    assert is_valid_api_key("change_this_secret") is False
    assert is_valid_api_key("test") is False
    assert is_valid_api_key("") is False


def test_accepts_realistic_keys():
    assert is_valid_api_key("a1b2c3d4e5f6g7h8i9j0") is True
    assert is_valid_api_key("sk-ant-api03-abcdefghijklmnopqrstuvwxyz") is True
