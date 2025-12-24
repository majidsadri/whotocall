#!/bin/bash

# Reachr Backend Deployment Script
# Usage: ./deploy.sh [options]
#
# Options:
#   --full     Full deployment (copy all files, install deps, restart)
#   --code     Code only (copy main.py, restart service)
#   --data     Data only (copy contacts.json)
#   --restart  Restart service only
#   --status   Check service status
#   --logs     View live logs

set -e

# Configuration
SERVER="ubuntu@18.215.164.114"
REMOTE_DIR="/mnt/data/reachr"
LOCAL_BACKEND="./backend"
LOCAL_DATA="./data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check SSH connection
check_connection() {
    log_info "Checking SSH connection..."
    if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Connected'" > /dev/null 2>&1; then
        log_error "Cannot connect to server. Check SSH configuration."
        exit 1
    fi
    log_info "Connection successful!"
}

# Copy backend code
deploy_code() {
    log_info "Copying backend code..."
    scp $LOCAL_BACKEND/main.py $LOCAL_BACKEND/requirements.txt $SERVER:$REMOTE_DIR/
    log_info "Code copied successfully!"
}

# Copy data file
deploy_data() {
    log_info "Copying data file..."
    scp $LOCAL_DATA/contacts.json $SERVER:$REMOTE_DIR/data/
    log_info "Data copied successfully!"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    ssh $SERVER "cd $REMOTE_DIR && source venv/bin/activate && pip install -r requirements.txt"
    log_info "Dependencies installed!"
}

# Restart service
restart_service() {
    log_info "Restarting service..."
    ssh $SERVER "sudo systemctl restart reachr"
    sleep 2
    log_info "Service restarted!"
}

# Check service status
check_status() {
    log_info "Checking service status..."
    ssh $SERVER "sudo systemctl status reachr --no-pager"
}

# View logs
view_logs() {
    log_info "Viewing logs (Ctrl+C to exit)..."
    ssh $SERVER "sudo journalctl -u reachr -f"
}

# Test API
test_api() {
    log_info "Testing API..."
    response=$(ssh $SERVER "curl -s http://localhost:5002/")
    echo "Response: $response"
    if [[ $response == *"Reachr API"* ]]; then
        log_info "API is responding correctly!"
    else
        log_error "API test failed!"
        exit 1
    fi
}

# Full deployment
full_deploy() {
    log_info "Starting full deployment..."
    check_connection
    deploy_code
    deploy_data
    install_deps
    restart_service
    sleep 2
    test_api
    check_status
    log_info "Full deployment complete!"
    echo ""
    echo "API URL: http://18.215.164.114:8080"
}

# Show usage
show_usage() {
    echo "Reachr Backend Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  --full     Full deployment (code + data + deps + restart)"
    echo "  --code     Deploy code only (main.py, requirements.txt)"
    echo "  --data     Deploy data only (contacts.json)"
    echo "  --restart  Restart service only"
    echo "  --status   Check service status"
    echo "  --logs     View live logs"
    echo "  --test     Test API endpoint"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh --full      # Full deployment"
    echo "  ./deploy.sh --code      # Quick code update"
    echo "  ./deploy.sh --logs      # View logs"
}

# Main
case "${1:-}" in
    --full)
        full_deploy
        ;;
    --code)
        check_connection
        deploy_code
        restart_service
        test_api
        ;;
    --data)
        check_connection
        deploy_data
        ;;
    --restart)
        check_connection
        restart_service
        check_status
        ;;
    --status)
        check_connection
        check_status
        ;;
    --logs)
        check_connection
        view_logs
        ;;
    --test)
        check_connection
        test_api
        ;;
    --help)
        show_usage
        ;;
    "")
        log_warn "No option specified. Running full deployment..."
        full_deploy
        ;;
    *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
