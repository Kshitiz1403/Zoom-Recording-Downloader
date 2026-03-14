package main

import (
	"encoding/json"
	"os"
	"sync"
)

type JSONDb struct {
	mu   sync.RWMutex
	path string
	data map[string]string
}

func NewJSONDb(path string) (*JSONDb, error) {
	db := &JSONDb{
		path: path,
		data: make(map[string]string),
	}

	if _, err := os.Stat(path); err == nil {
		file, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		if len(file) > 0 {
			if err := json.Unmarshal(file, &db.data); err != nil {
				return nil, err
			}
		}
	}

	return db, nil
}

func (db *JSONDb) Set(key, value string) error {
	db.mu.Lock()
	defer db.mu.Unlock()
	db.data[key] = value
	return db.save()
}

func (db *JSONDb) Get(key string) (string, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	val, ok := db.data[key]
	return val, ok
}

func (db *JSONDb) save() error {
	data, err := json.Marshal(db.data)
	if err != nil {
		return err
	}
	return os.WriteFile(db.path, data, 0644)
}
