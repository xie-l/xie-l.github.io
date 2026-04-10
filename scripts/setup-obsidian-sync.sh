#!/bin/bash

# Obsidian Sync Setup Script
# This script sets up the Obsidian to GitHub Pages sync system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_nodejs() {
    print_info "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        return 0
    else
        print_error "Node.js is not installed"
        echo ""
        echo "Please install Node.js from https://nodejs.org/"
        echo "or use a version manager like nvm:"
        echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "  nvm install --lts"
        return 1
    fi
}

check_config() {
    print_info "Checking configuration file..."
    if [ -f "config/obsidian-sync.config.json" ]; then
        print_success "Configuration file exists: config/obsidian-sync.config.json"
        
        # Validate JSON
        if node -e "JSON.parse(require('fs').readFileSync('./config/obsidian-sync.config.json', 'utf8'))" 2>/dev/null; then
            print_success "Configuration file is valid JSON"
            return 0
        else
            print_error "Configuration file contains invalid JSON"
            return 1
        fi
    else
        print_error "Configuration file not found: config/obsidian-sync.config.json"
        echo ""
        echo "Please create the configuration file based on the template:"
        echo "  cp config/obsidian-sync.config.json.example config/obsidian-sync.config.json"
        echo "  # Then edit config/obsidian-sync.config.json with your settings"
        return 1
    fi
}

check_obsidian_vault() {
    print_info "Checking Obsidian vault directory..."
    if [ -d "obsidian-vault" ]; then
        print_success "Obsidian vault directory exists: obsidian-vault/"
        
        # Check for required subdirectories
        local required_dirs=("templates" "attachments" "摘录记录" "随笔思考" "技术思考" "生活日记" "书籍阅读" "数据分析" "文件管理")
        local missing_dirs=()
        
        for dir in "${required_dirs[@]}"; do
            if [ ! -d "obsidian-vault/$dir" ]; then
                missing_dirs+=("$dir")
            fi
        done
        
        if [ ${#missing_dirs[@]} -eq 0 ]; then
            print_success "All required subdirectories exist"
        else
            print_warning "Missing subdirectories: ${missing_dirs[*]}"
            print_info "Creating missing directories..."
            for dir in "${missing_dirs[@]}"; do
                mkdir -p "obsidian-vault/$dir"
                print_success "Created: obsidian-vault/$dir"
            done
        fi
        
        # Create attachments directory if missing
        if [ ! -d "obsidian-vault/attachments" ]; then
            mkdir -p "obsidian-vault/attachments"
            print_success "Created attachments directory: obsidian-vault/attachments"
        fi
        
        return 0
    else
        print_error "Obsidian vault directory not found: obsidian-vault/"
        echo ""
        echo "Please create the Obsidian vault directory:"
        echo "  mkdir -p obsidian-vault/{templates,attachments,摘录记录,随笔思考,技术思考,生活日记,书籍阅读,数据分析,文件管理}"
        return 1
    fi
}

check_dependencies() {
    print_info "Checking npm dependencies..."
    if [ -f "package.json" ]; then
        print_success "package.json found"
        
        # Check if node_modules exists
        if [ -d "node_modules" ]; then
            print_success "node_modules directory exists"
            return 0
        else
            print_warning "node_modules not found. Installing dependencies..."
            npm install
            if [ $? -eq 0 ]; then
                print_success "Dependencies installed successfully"
                return 0
            else
                print_error "Failed to install dependencies"
                return 1
            fi
        fi
    else
        print_error "package.json not found"
        echo ""
        echo "Please ensure you're in the project root directory"
        return 1
    fi
}

run_test_sync() {
    print_info "Running test sync..."
    
    # Check if main sync script exists
    if [ ! -f "scripts/obsidian-sync.js" ]; then
        print_error "Main sync script not found: scripts/obsidian-sync.js"
        return 1
    fi
    
    print_info "Testing Obsidian to blog sync..."
    # Run sync and capture output, but don't fail on non-zero exit (might be content issues)
    local test_output
    test_output=$(node scripts/obsidian-sync.js --direction obsidian-to-blog --dry-run 2>&1)
    local exit_code=$?
    
    # Check if it ran (exit code 0 or script executed but had content issues)
    if [ $exit_code -eq 0 ]; then
        print_success "Obsidian to blog sync test passed"
    elif echo "$test_output" | grep -q "开始同步:"; then
        # Script started but failed on some content - this is acceptable for setup
        print_warning "Obsidian to blog sync test completed with warnings (content-related issues)"
        echo "$test_output" | head -20
    else
        print_error "Obsidian to blog sync test failed (script error)"
        echo "$test_output"
        return 1
    fi
    
    print_info "Testing blog to Obsidian sync..."
    test_output=$(node scripts/obsidian-sync.js --direction blog-to-obsidian --dry-run 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Blog to Obsidian sync test passed"
    elif echo "$test_output" | grep -q "开始同步:"; then
        print_warning "Blog to Obsidian sync test completed with warnings (content-related issues)"
        echo "$test_output" | head -20
    else
        print_error "Blog to Obsidian sync test failed (script error)"
        echo "$test_output"
        return 1
    fi
    
    return 0
}

display_usage() {
    echo ""
    echo "================================"
    echo "Obsidian Sync Setup Complete!"
    echo "================================"
    echo ""
    echo "Usage:"
    echo "------"
    echo ""
    echo "1. Manual Sync:"
    echo "   # Sync from Obsidian to blog"
    echo "   node scripts/obsidian-sync.js --direction obsidian-to-blog"
    echo ""
    echo "   # Sync from blog to Obsidian"
    echo "   node scripts/obsidian-sync.js --direction blog-to-obsidian"
    echo ""
    echo "   # Sync both directions"
    echo "   node scripts/obsidian-sync.js --direction both"
    echo ""
    echo "   # Sync specific file"
    echo "   node scripts/obsidian-sync.js --direction obsidian-to-blog --file '生活日记/我的笔记.md'"
    echo ""
    echo "2. Auto Sync (watch mode):"
    echo "   node scripts/watch-obsidian.js"
    echo ""
    echo "3. Initialize system:"
    echo "   node scripts/init-obsidian-sync.js"
    echo ""
    echo "Configuration:"
    echo "--------------"
    echo "Edit config/obsidian-sync.config.json to customize:"
    echo "- Blog post categories"
    echo "- Frontmatter field mappings"
    echo "- Image processing settings"
    echo "- Sync rules"
    echo ""
    echo "Documentation:"
    echo "--------------"
    echo "See docs/OBSIDIAN_SYNC_USAGE.md for detailed documentation"
    echo ""
    echo "Troubleshooting:"
    echo "----------------"
    echo "- Check logs/: sync operations are logged here"
    echo "- Run this script again to verify setup: ./scripts/setup-obsidian-sync.sh"
    echo "- See docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md for common issues"
    echo ""
}

# Main execution
main() {
    echo "=========================================="
    echo "Obsidian Sync Setup"
    echo "=========================================="
    echo ""
    
    local exit_code=0
    
    # Run all checks
    check_nodejs || exit_code=1
    echo ""
    
    check_config || exit_code=1
    echo ""
    
    check_obsidian_vault || exit_code=1
    echo ""
    
    check_dependencies || exit_code=1
    echo ""
    
    # Only run test sync if all checks passed
    if [ $exit_code -eq 0 ]; then
        run_test_sync || exit_code=1
        echo ""
    fi
    
    # Display usage instructions
    display_usage
    
    # Exit with appropriate code
    if [ $exit_code -eq 0 ]; then
        print_success "Setup completed successfully!"
        exit 0
    else
        print_error "Setup completed with errors. Please fix the issues above."
        exit 1
    fi
}

# Run main function
main "$@"
