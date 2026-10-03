#!/bin/sh
# Run once per `docker compose up` by the minio-init service. Every step is safe to repeat.
set -e

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

mc mb --ignore-existing "local/$S3_BUCKET"

# Emailed links stop working after 7 days, so the zips are deleted then too.
echo '{"Rules":[{"ID":"expire-zips","Status":"Enabled","Filter":{"Prefix":""},"Expiration":{"Days":7}}]}' \
  | mc ilm rule import "local/$S3_BUCKET"

# The app signs links with its own key rather than the root user's.
mc admin user add local "$S3_ACCESS_KEY" "$S3_SECRET_KEY"
mc admin policy attach local readwrite --user "$S3_ACCESS_KEY" || true # fails if already attached
