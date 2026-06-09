#!/bin/bash

# Port assignments:
# Gateway: 5080
# Users: 5081
# PaymentMethods: 5082
# Transactions: 5083
# Categories: 5084
# Goals: 5085
# Notifications: 5086
# FixedIncomes: 5087

services=(
    "API.Users"
    "API.PaymentMethods"
    "API.Transactions"
    "API.Categories"
    "API.Goals"
    "API.Notifications"
    "API.FixedIncomes"
)

ports=(5080 5081 5082 5083 5084 5085 5086 5087)
PID_DIR=".pids"

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

echo "=========================================================="
echo " Stopping leftover processes..."
echo "=========================================================="

# 1. Kill using saved PID files
if [ -f "$PID_DIR/API.pid" ]; then
    pid=$(cat "$PID_DIR/API.pid")
    if kill -0 "$pid" 2>/dev/null; then
        echo "Killing leftover gateway API (PID: $pid)..."
        kill "$pid" 2>/dev/null
        wait "$pid" 2>/dev/null
    fi
    rm "$PID_DIR/API.pid"
fi

for service in "${services[@]}"; do
    pid_file="$PID_DIR/$service.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Killing leftover service $service (PID: $pid)..."
            kill "$pid" 2>/dev/null
            wait "$pid" 2>/dev/null
        fi
        rm "$pid_file"
    fi
done

# 2. Double-check and kill by listening ports (just in case of dangling processes)
for port in "${ports[@]}"; do
    pid=$(lsof -t -i :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing dangling process on port $port (PID: $pid)..."
        kill -9 "$pid" 2>/dev/null
    fi
done

echo ""
echo "=========================================================="
echo " Starting API Gateway (API)..."
echo "=========================================================="

# Start Gateway first
echo "Launching API Gateway (which runs database migrations and seeding)..."
dotnet run --project "API/API.csproj" &
gateway_pid=$!
echo "$gateway_pid" > "$PID_DIR/API.pid"

# Helper function to wait for port to be ready
wait_for_port() {
    local port=$1
    local pid=${2:-}
    for i in {1..40}; do
        if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
            return 0
        fi

        # If the process exits before opening the port, fail early.
        if [ ! -z "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
            return 2
        fi
        sleep 0.5
    done
    return 1
}

# Wait for gateway to start
echo "Waiting for API Gateway to be ready on port 5080..."
if wait_for_port 5080 "$gateway_pid"; then
    echo "API Gateway is ready!"
else
    wait_status=$?
    if [ "$wait_status" -eq 2 ]; then
        echo "API Gateway process exited before opening port 5080."
    else
        echo "API Gateway failed to start or listen on port 5080 in time."
    fi
    kill "$gateway_pid" 2>/dev/null
    exit 1
fi

echo ""
echo "=========================================================="
echo " Starting ClariFi Microservices..."
echo "=========================================================="

# Start each service in the background and record its PID
for service in "${services[@]}"; do
    echo "Launching $service..."
    dotnet run --project "$service/$service.csproj" &
    pid=$!
    echo "$pid" > "$PID_DIR/$service.pid"
done

# Clean up PID files when script exits (via Ctrl+C)
cleanup() {
    echo ""
    echo "=========================================================="
    echo " Stopping all services..."
    echo "=========================================================="
    
    # Kill gateway
    if [ -f "$PID_DIR/API.pid" ]; then
        pid=$(cat "$PID_DIR/API.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping API Gateway (PID: $pid)..."
            kill "$pid" 2>/dev/null
        fi
        rm "$PID_DIR/API.pid"
    fi

    # Kill other services
    for service in "${services[@]}"; do
        pid_file="$PID_DIR/$service.pid"
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo "Stopping $service (PID: $pid)..."
                kill "$pid" 2>/dev/null
            fi
            rm "$pid_file"
        fi
    done
    rmdir "$PID_DIR" 2>/dev/null
}

trap cleanup EXIT

# Wait for background processes to keep running
wait
