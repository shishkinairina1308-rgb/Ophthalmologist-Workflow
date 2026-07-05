package main

import (
	"database/sql"
	"log"
	"time"

	"github.com/LLergibt/Ophthalmologist-Workflow/internal/config"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/handler"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/repository/postgres"
	"github.com/LLergibt/Ophthalmologist-Workflow/internal/service"

	"github.com/gin-contrib/cors"
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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// ==========================================

	// Публичные маршруты (теперь защищены CORS)
	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)

	// Защищенные маршруты
	protected := r.Group("/api")
	protected.Use(handler.AuthMiddleware(cfg.JWTSecret))
	{
		patientHandler := &handler.PatientHandler{DB: db}

		protected.GET("/patients", patientHandler.ListPatients)
		protected.POST("/patients", patientHandler.CreatePatient)
		protected.GET("/patients/:id", patientHandler.GetPatientProfile)

		protected.POST("/patients/:id/records", patientHandler.CreateRecord)

		protected.GET("/templates", patientHandler.GetTemplates)
		protected.POST("/templates", patientHandler.CreateTemplate)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
