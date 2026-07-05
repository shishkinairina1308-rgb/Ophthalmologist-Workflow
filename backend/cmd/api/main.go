package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/LLergibt/Ophthalmologist-Workflow/internal/config"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/handler"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/repository/postgres"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/service"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	cfg := config.LoadConfig()

	var db *sql.DB
	var err error
	for i := 0; i < 5; i++ {
		db, err = sql.Open("postgres", cfg.DBConnString)
		if err == nil {
			err = db.Ping()
		}
		if err == nil {
			break
		}
		log.Println("Database not ready yet, retrying in 2 seconds...")
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer db.Close()

	userRepo := postgres.NewUserRepository(db)
	if err := userRepo.InitTables(); err != nil {
		log.Fatalf("Failed to initialize tables: %v", err)
	}

	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	authHandler := handler.NewAuthHandler(authService)

	r := gin.Default()

	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)

	protected := r.Group("/api")
	protected.Use(handler.AuthMiddleware(cfg.JWTSecret))
	{
		protected.GET("/patients", func(c *gin.Context) {
			role, _ := c.Get("userRole")
			c.JSON(http.StatusOK, gin.H{
				"message": "Welcome to patient dashboard",
				"your_role": role,
				"data": []string{"Пациент Иванов: Миопия (-3.5)", "Пациент Петров: Здоров"},
			})
		})
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
