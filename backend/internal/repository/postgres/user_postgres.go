package postgres

import (
	"database/sql"
	"errors"

	"github.com/LLergibt/Ophthalmologist-Workflow/internal/domain"

	"github.com/lib/pq"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// InitTables создает таблицу пользователей, если её нет
func (r *UserRepository) InitTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		full_name VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL DEFAULT 'doctor'
	);`
	_, err := r.db.Exec(query)
	return err
}

func (r *UserRepository) Create(user *domain.User) error {
	query := `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id`
	err := r.db.QueryRow(query, user.Email, user.PasswordHash, user.FullName, user.Role).Scan(&user.ID)

	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" { // код дубликата в postgres
			return domain.ErrUserAlreadyExists
		}
		return err
	}
	return nil
}

func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	query := `SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1`
	user := &domain.User{}

	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}
