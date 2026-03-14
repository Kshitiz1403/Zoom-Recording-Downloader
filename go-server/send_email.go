package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
)

type postmarkMessage struct {
	From     string `json:"From"`
	To       string `json:"To"`
	Subject  string `json:"Subject"`
	TextBody string `json:"TextBody"`
	HtmlBody string `json:"HtmlBody"`
}

func sendEmail(presignedURL string, fileNames []string, zoomAccount string) error {
	text := fmt.Sprintf(
		"Your Zoom Download for the account %s is ready with the files - %s \n Click the link below to download it <%s>. The link is only valid for 7 days.",
		zoomAccount, strings.Join(fileNames, "\n"), presignedURL,
	)

	html := fmt.Sprintf(
		"Your Zoom Download for the account <b>%s</b> is ready with the files - <br><br>%s<br><br>Click the link below to download it-<br><a href='%s'>Download</a> <br><br>The link is only valid for 7 days.",
		zoomAccount, strings.Join(fileNames, "<br>"), presignedURL,
	)

	msg := postmarkMessage{
		From:     "zoom@kshitizagrawal.in",
		To:       "sanjeev@dreamsoft4u.com,kshitizagrawal@outlook.com",
		Subject:  "Your Zoom Download is Ready",
		TextBody: text,
		HtmlBody: html,
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.postmarkapp.com/email", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Postmark-Server-Token", os.Getenv("POSTMARK_API_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("postmark returned status %d", resp.StatusCode)
	}

	fmt.Println("Email sent")
	return nil
}
