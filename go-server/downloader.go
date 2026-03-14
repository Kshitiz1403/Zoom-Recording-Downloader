package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type DownloadRequest struct {
	Account     string `json:"account"`
	AccessToken string `json:"access_token"`
}

type RecordingsResponse struct {
	Meetings []Meeting `json:"meetings"`
}

type Meeting struct {
	Topic          string          `json:"topic"`
	StartTime      string          `json:"start_time"`
	RecordingFiles []RecordingFile `json:"recording_files"`
}

type RecordingFile struct {
	DownloadURL   string `json:"download_url"`
	FileSize      int64  `json:"file_size"`
	FileExtension string `json:"file_extension"`
}

var validAccounts = map[string]bool{
	"careers@dreamsoft4u.com":  true,
	"sanjeev@dreamsoft4u.com":  true,
	"gaurav.s@dreamsoft4u.com": true,
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
	var req DownloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`"Invalid request body"`))
		return
	}

	if !validAccounts[req.Account] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`"Invalid account"`))
		return
	}

	meetings, err := fetchMeetings(req.Account, req.AccessToken)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`"Failed to fetch meetings"`))
		return
	}

	transactionID, err := downloadFiles(meetings, req.AccessToken, req.Account)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`"Failed to start download"`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactionID)
}

func fetchMeetings(account, accessToken string) ([]Meeting, error) {
	url := fmt.Sprintf("https://api.zoom.us/v2/users/%s/recordings?from=2022-02-07", account)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var recordings RecordingsResponse
	if err := json.NewDecoder(resp.Body).Decode(&recordings); err != nil {
		return nil, err
	}

	return recordings.Meetings, nil
}

type fileJob struct {
	url      string
	filePath string
	fileName string
}

func downloadFiles(meetings []Meeting, accessToken, zoomAccount string) (string, error) {
	transactionID := uuid.New().String()

	var jobs []fileJob
	statusObj := map[string]string{}

	for _, meeting := range meetings {
		for _, file := range meeting.RecordingFiles {
			fileURL := fmt.Sprintf("%s?access_token=%s", file.DownloadURL, accessToken)
			fileDate := dateHandler(meeting.StartTime)
			fileName := fmt.Sprintf("%s %s.%s", meeting.Topic, fileDate, strings.ToLower(file.FileExtension))

			directory := filepath.Join(downloadDirectory, transactionID)
			if err := os.MkdirAll(directory, 0755); err != nil {
				return "", err
			}

			filePath := filepath.Join(directory, fileName)
			statusObj[fileName] = "downloading"
			jobs = append(jobs, fileJob{url: fileURL, filePath: filePath, fileName: fileName})
		}
	}

	statusJSON, _ := json.Marshal(statusObj)
	db.Set(transactionID, string(statusJSON))

	go func() {
		var wg sync.WaitGroup
		results := make(chan string, len(jobs))

		for _, job := range jobs {
			wg.Add(1)
			go func(j fileJob) {
				defer wg.Done()
				log.Printf("Downloading %s", j.fileName)
				if err := downloadFile(j.url, j.filePath); err != nil {
					log.Printf("Failed to download %s: %v", j.fileName, err)
					return
				}
				results <- j.fileName
			}(job)
		}

		wg.Wait()
		close(results)

		status := map[string]string{}
		for name := range results {
			status[name] = "downloaded"
		}

		transactionDownloadDir := filepath.Join(downloadDirectory, transactionID)
		zipPath := filepath.Join(zipsDirectory, transactionID+".zip")

		if err := zipDirectory(transactionDownloadDir, zipPath); err != nil {
			log.Printf("Failed to zip directory: %v", err)
			return
		}

		statusJSON, _ := json.Marshal(status)
		db.Set(transactionID, string(statusJSON))

		os.RemoveAll(transactionDownloadDir)

		if err := uploadToS3(zipPath, transactionID); err != nil {
			log.Printf("Failed to upload to S3: %v", err)
			return
		}

		presignedURL, err := generatePresignedURL(transactionID, 7)
		if err != nil {
			log.Printf("Failed to generate presigned URL: %v", err)
			return
		}

		log.Println("Presigned URL:", presignedURL)

		var fileNames []string
		for _, j := range jobs {
			fileNames = append(fileNames, j.fileName)
		}

		if err := sendEmail(presignedURL, fileNames, zoomAccount); err != nil {
			log.Printf("Failed to send email: %v", err)
		}

		os.Remove(zipPath)
	}()

	return transactionID, nil
}

func downloadFile(url, filePath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, resp.Body)
	return err
}

func zipDirectory(srcDir, destZip string) error {
	zipFile, err := os.Create(destZip)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}

		writer, err := zipWriter.Create(relPath)
		if err != nil {
			return err
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})
}

func getStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	transactionID := vars["id"]

	val, ok := db.Get(transactionID)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("null"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(val))
}

func getFilesForID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	transactionID := vars["id"]

	url := fmt.Sprintf("https://zoom.kshitizagrawal.in/%s.zip", transactionID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(url)
}

func dateHandler(zFormat string) string {
	t, err := time.Parse(time.RFC3339, zFormat)
	if err != nil {
		return zFormat
	}

	day := fmt.Sprintf("%02d", t.Day())
	month := fmt.Sprintf("%02d", int(t.Month()))
	year := t.Year()
	hour := fmt.Sprintf("%02d", t.Hour())
	min := fmt.Sprintf("%02d", t.Minute())
	sec := fmt.Sprintf("%02d", t.Second())

	return fmt.Sprintf("%s-%s-%d-%s_%s_%s", day, month, year, hour, min, sec)
}
