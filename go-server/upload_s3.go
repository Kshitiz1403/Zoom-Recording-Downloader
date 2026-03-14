package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const bucketName = "zoom-downloads-2"

func newS3Client() (*s3.Client, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			os.Getenv("SPACES_KEY"),
			os.Getenv("SPACES_SECRET"),
			"",
		)),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String("https://blr1.digitaloceanspaces.com")
		o.UsePathStyle = false
	})

	return client, nil
}

func uploadToS3(filePath, transactionID string) error {
	client, err := newS3Client()
	if err != nil {
		return fmt.Errorf("failed to create S3 client: %w", err)
	}

	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(transactionID + ".zip"),
		Body:   file,
	})
	return err
}

func generatePresignedURL(transactionID string, expirationDays int) (string, error) {
	client, err := newS3Client()
	if err != nil {
		return "", fmt.Errorf("failed to create S3 client: %w", err)
	}

	presignClient := s3.NewPresignClient(client)

	result, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(transactionID + ".zip"),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(expirationDays) * 24 * time.Hour
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return result.URL, nil
}
