package domain

import "errors"

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
)

type User struct {
	ID           int    `json:"id"`
	Email        string `json:"email" binding:"required,email"`
	PasswordHash string `json:"-"`
	Password     string `json:"password,omitempty" binding:"required,min=6"`
	FullName     string `json:"full_name" binding:"required"`
	Role         string `json:"role"` // e.g., "doctor", "admin", "assistant"
}
