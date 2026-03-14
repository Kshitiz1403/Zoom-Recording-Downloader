package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

const redirectURL = "https://zoom.kshitizagrawal.in"
const downloadDirectory = "./downloads"
const zipsDirectory = "./zips"
const port = "7229"

var db *JSONDb

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	if err := os.MkdirAll(downloadDirectory, 0755); err != nil {
		log.Fatalf("Failed to create downloads directory: %v", err)
	}
	if err := os.MkdirAll(zipsDirectory, 0755); err != nil {
		log.Fatalf("Failed to create zips directory: %v", err)
	}

	var err error
	db, err = NewJSONDb("./store.json")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	r := mux.NewRouter()

	r.HandleFunc("/api/status/{id}", getStatus).Methods("GET")
	r.HandleFunc("/download/{id}", getFilesForID).Methods("GET")
	r.HandleFunc("/download", handleDownload).Methods("POST")
	r.PathPrefix("/status/").HandlerFunc(serveIndexHTML)
	r.HandleFunc("/", getToken).Methods("GET")
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(zipsDirectory)))

	fmt.Printf("Server listening on %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func serveIndexHTML(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./index.html")
}
