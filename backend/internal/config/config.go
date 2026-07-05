package config

import (
	"os"
)

type Config struct {
	Port         string
	DBConnString string
	JWTSecret    string
}

func LoadConfig() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		DBConnString: getEnv("DATABASE_URL", "postgres://postgres:postgres@db:5432/ophthalmology?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "super_secret_eye_doctor_key"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
