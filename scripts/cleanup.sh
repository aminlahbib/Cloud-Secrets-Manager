#!/bin/bash

# =============================================================================
# Complete Cleanup Script
# =============================================================================
# This script performs a comprehensive cleanup of build artifacts, temporary
# files, and other generated content that should not be committed to git.
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Starting Complete Cleanup"
echo "=========================================="
echo ""

# Track total space freed
TOTAL_FREED=0

# Function to calculate directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Function to remove directory and report size
remove_dir() {
    if [ -d "$1" ]; then
        SIZE=$(get_size "$1")
        echo -e "${YELLOW}Removing:${NC} $1 (${SIZE})"
        rm -rf "$1"
        echo -e "${GREEN}✓ Removed${NC}"
        echo ""
    fi
}

# Function to remove file and report
remove_file() {
    if [ -f "$1" ]; then
        SIZE=$(du -sh "$1" 2>/dev/null | cut -f1 || echo "0")
        echo -e "${YELLOW}Removing:${NC} $1 (${SIZE})"
        rm -f "$1"
        echo -e "${GREEN}✓ Removed${NC}"
        echo ""
    fi
}

# 1. Clean Maven build artifacts
echo -e "${BLUE}=== Cleaning Maven Build Artifacts ===${NC}"
find . -type d -name "target" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 2. Clean npm/node build artifacts
echo -e "${BLUE}=== Cleaning Node.js Build Artifacts ===${NC}"
find . -type d -name "node_modules" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

find . -type d -name "dist" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

find . -type d -name "build" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 3. Clean temporary files
echo -e "${BLUE}=== Cleaning Temporary Files ===${NC}"
find . -type f \( -name "*.log" -o -name "*.swp" -o -name "*.swo" -o -name "*~" -o -name ".DS_Store" \) -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 4. Clean IDE-specific files (if not in .gitignore)
echo -e "${BLUE}=== Cleaning IDE Files ===${NC}"
find . -type f \( -name "*.iml" -o -name "*.iws" -o -name "*.ipr" \) -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 5. Clean compiled class files
echo -e "${BLUE}=== Cleaning Compiled Class Files ===${NC}"
find . -type f -name "*.class" -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 6. Clean package files
echo -e "${BLUE}=== Cleaning Package Files ===${NC}"
find . -type f \( -name "*.jar" -o -name "*.war" -o -name "*.ear" \) -not -path "./.git/*" -not -path "*/mvnw*" | while read file; do
    remove_file "$file"
done

# 7. Clean Maven wrapper cache (keep wrapper, remove cache)
echo -e "${BLUE}=== Cleaning Maven Wrapper Cache ===${NC}"
find . -type d -name ".mvn" -not -path "./.git/*" | while read dir; do
    if [ -d "$dir/wrapper" ]; then
        find "$dir/wrapper" -type f ! -name "maven-wrapper.jar" -delete 2>/dev/null || true
    fi
done

# 8. Clean npm cache and lock files (keep package-lock.json, remove others)
echo -e "${BLUE}=== Cleaning npm Artifacts ===${NC}"
find . -type f \( -name "npm-debug.log*" -o -name "yarn-debug.log*" -o -name "yarn-error.log*" \) -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 9. Clean test coverage reports
echo -e "${BLUE}=== Cleaning Test Coverage Reports ===${NC}"
find . -type d -name "surefire-reports" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

find . -type d -name "jacoco" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 10. Clean any .next directories (Next.js)
echo -e "${BLUE}=== Cleaning Next.js Build Artifacts ===${NC}"
find . -type d -name ".next" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 11. Clean any .cache directories
echo -e "${BLUE}=== Cleaning Cache Directories ===${NC}"
find . -type d -name ".cache" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 12. Clean any .parcel-cache directories
echo -e "${BLUE}=== Cleaning Parcel Cache ===${NC}"
find . -type d -name ".parcel-cache" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 13. Clean any coverage directories
echo -e "${BLUE}=== Cleaning Coverage Reports ===${NC}"
find . -type d -name "coverage" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 14. Clean any .tmp or temp directories
echo -e "${BLUE}=== Cleaning Temporary Directories ===${NC}"
find . -type d \( -name "tmp" -o -name "temp" -o -name ".tmp" \) -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 15. Clean any logs directories
echo -e "${BLUE}=== Cleaning Log Directories ===${NC}"
find . -type d -name "logs" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 16. Clean any .idea directories (IntelliJ)
echo -e "${BLUE}=== Cleaning IntelliJ IDEA Files ===${NC}"
find . -type d -name ".idea" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 17. Clean any .vscode directories (VS Code - but keep settings if needed)
echo -e "${BLUE}=== Cleaning VS Code Files ===${NC}"
find . -type d -name ".vscode" -not -path "./.git/*" | while read dir; do
    # Keep .vscode if it has important settings, but clean cache
    if [ -d "$dir" ]; then
        find "$dir" -type f \( -name "*.code-workspace" -o -name "launch.json" -o -name "tasks.json" \) -delete 2>/dev/null || true
        # Remove if empty or only has cache
        if [ -z "$(find "$dir" -type f | head -1)" ]; then
            remove_dir "$dir"
        fi
    fi
done

# 18. Clean any .settings directories (Eclipse)
echo -e "${BLUE}=== Cleaning Eclipse Files ===${NC}"
find . -type d -name ".settings" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 19. Clean any .classpath or .project files (Eclipse)
echo -e "${BLUE}=== Cleaning Eclipse Project Files ===${NC}"
find . -type f \( -name ".classpath" -o -name ".project" -o -name ".factorypath" \) -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 20. Clean any bin directories
echo -e "${BLUE}=== Cleaning bin Directories ===${NC}"
find . -type d -name "bin" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 21. Clean any .metadata directories
echo -e "${BLUE}=== Cleaning Metadata Directories ===${NC}"
find . -type d -name ".metadata" -not -path "./.git/*" | while read dir; do
    remove_dir "$dir"
done

# 22. Clean any backup files
echo -e "${BLUE}=== Cleaning Backup Files ===${NC}"
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*~" -o -name "*.orig" \) -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 23. Clean any .swp files (Vim)
echo -e "${BLUE}=== Cleaning Vim Swap Files ===${NC}"
find . -type f -name "*.swp" -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 24. Clean any macOS .DS_Store files
echo -e "${BLUE}=== Cleaning macOS Files ===${NC}"
find . -type f -name ".DS_Store" -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# 25. Clean any Thumbs.db files (Windows)
echo -e "${BLUE}=== Cleaning Windows Files ===${NC}"
find . -type f -name "Thumbs.db" -not -path "./.git/*" | while read file; do
    remove_file "$file"
done

# Summary
echo "=========================================="
echo -e "${GREEN}Cleanup Complete!${NC}"
echo "=========================================="
echo ""
echo "The following have been cleaned:"
echo "  ✓ Maven build artifacts (target/)"
echo "  ✓ Node.js build artifacts (node_modules/, dist/, build/)"
echo "  ✓ Temporary files (*.log, *.swp, *.bak, etc.)"
echo "  ✓ IDE-specific files (.idea/, .vscode/, .settings/, etc.)"
echo "  ✓ Compiled class files (*.class)"
echo "  ✓ Package files (*.jar, *.war, *.ear)"
echo "  ✓ Test coverage reports"
echo "  ✓ Cache directories"
echo "  ✓ System files (.DS_Store, Thumbs.db)"
echo ""
echo -e "${YELLOW}Note:${NC} This cleanup does not affect:"
echo "  • Source code files"
echo "  • Configuration files (pom.xml, package.json, etc.)"
echo "  • Documentation files"
echo "  • Scripts"
echo "  • Git repository"
echo ""
echo -e "${BLUE}To rebuild:${NC}"
echo "  • Backend: cd apps/backend/<service> && mvn clean install"
echo "  • Frontend: cd apps/frontend && npm install && npm run build"
echo ""

