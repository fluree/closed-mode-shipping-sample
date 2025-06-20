#!/bin/bash
PREFIX="\033[33mstart.sh    |\033[0m"

# Set up trap for cleanup when script is aborted
cleanup() {
  echo -e "\n$PREFIX Aborting... Cleaning up Docker volumes."
  docker compose down --volumes --remove-orphans
  exit 1
}
trap cleanup INT

# Set container name
CONTAINER_NAME="fluree-closed-mode"

check_container() {
  trap cleanup INT

  echo -e "$PREFIX Checking if container $CONTAINER_NAME is running..."

  # Wait for the container to be healthy
  for i in {1..10}; do
    trap cleanup INT
    container_status=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "not found")
    echo -e "$PREFIX Container status: $container_status"

    if [ "$container_status" == "running" ]; then
      echo -e "$PREFIX Container $CONTAINER_NAME is now running."
      return 0
    elif [ "$container_status" == "exited" ]; then
      echo -e "$PREFIX Container $CONTAINER_NAME has exited. Aborting."
      cleanup
    elif [ "$container_status" == "dead" ]; then
      echo -e "$PREFIX Container $CONTAINER_NAME has died or been killed. Aborting"
      cleanup
    else
      echo -e "$PREFIX Waiting for container to become healthy... ($i/10)"
    fi

    sleep 3
  done

  echo -e "$PREFIX Container $CONTAINER_NAME did not become healthy within the timeout. Aborting."
  cleanup
}

# Check for --clean flag and delete ./data directory if present
if [[ " $* " == *" --clean "* ]]; then
  echo -e "$PREFIX --clean flag detected. Deleting ./data directory..."
  rm -rf ./data
fi


# Pull image first
docker compose pull

# Step 1: Run docker compose up
docker compose up -d

# Determine the data directory based on argument or environment variable
MIGRATION_DIR="${MIGRATION_DIR:-SampleData}"

# Set URL for API requests
PORT="8090"
URL="http://localhost:$PORT"
TRANSACTION_URL="$URL/fluree"

# Step 2: Check if ./data directory exists or is empty
if [ ! -d "./data" ] || [ -z "$(ls -A ./data)" ]; then
  echo -e "$PREFIX Allowing Fluree service within container to start..."
  sleep 5

  check_container

  echo -e "$PREFIX ./data directory is missing or empty. Processing migration data."

  # Step 2.1: Loop through each file in migration directory
  first_file=true
  for file in "$MIGRATION_DIR"/*; do
    if $first_file; then
      echo -e "$PREFIX Sending create request for $file"
      response=$(curl -s -o /dev/null -w "%{http_code}" -H "Content-Type: application/json" -X POST "$TRANSACTION_URL/create" -d @"$file")
      first_file=false
    else
      echo -e "$PREFIX Sending transact request for $file"
      response=$(curl -s -o /dev/null -w "%{http_code}" -H "Content-Type: application/json" -X POST "$TRANSACTION_URL/transact" -d @"$file")
    fi

    # Wait for a successful response (HTTP 200 or 201)
    if [ "$response" -ne 200 ] && [ "$response" -ne 201 ]; then
      echo -e "$PREFIX Request failed for $file with HTTP status $response. Aborting."
      read -n 1 -s -r -p "Press any key to continue..."
      cleanup
    else
      echo -e "$PREFIX Success for $file"
    fi
  done
else
  echo -e "$PREFIX ./data directory exists and is not empty. Skipping migration."
fi

sleep 2
echo -e "$PREFIX $CONTAINER_NAME is running on $PORT. Press Ctrl+C (^C on Mac) to stop and run cleanup"

while :; do
  sleep 1
done
