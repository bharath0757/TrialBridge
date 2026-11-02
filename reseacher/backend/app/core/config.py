from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str = ''
    MONGODB_DATABASE: str = 'trialbridge'
    JWT_SECRET: str = ''
    GEMINI_API_KEY: str = ''
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRATION_HOURS: int = 24
    CORS_ORIGINS: str = 'http://localhost:5173,http://127.0.0.1:5173,https://trialbridge-in-5443.web.app,https://trialbridge-in-5443.firebaseapp.com'
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

settings = Settings()
