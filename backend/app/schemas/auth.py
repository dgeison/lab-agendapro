from pydantic import BaseModel
from typing import Optional


class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    public_slug: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserResponse
    token: Token