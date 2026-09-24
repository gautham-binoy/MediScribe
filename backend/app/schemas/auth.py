from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DoctorProfileResponse(BaseModel):
    id: str
    license_number: str
    specialization: str
    hospital: str
    consultation_room: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: str | None = None
    doctor_profile: DoctorProfileResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
