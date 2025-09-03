# #!/bin/bash

# # Script to add "export {};" to all empty JavaScript/TypeScript files
# # in a Next.js project

# set -e  # Exit on any error

# # Colors for output
# RED='\033[0;31m'
# GREEN='\033[0;32m'
# YELLOW='\033[1;33m'
# BLUE='\033[0;34m'
# NC='\033[0m' # No Color

# echo -e "${BLUE}🔍 Searching for empty JavaScript/TypeScript files...${NC}"

# # Counter for processed files
# count=0

# # Find all empty files with JS/TS extensions
# # -type f: only files
# # -size 0: only empty files (0 bytes)
# # -name: match JS/TS file extensions
# find . \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.mjs" -o -name "*.cjs" \) \
#      -type f -size 0 \
#      -not -path "./node_modules/*" \
#      -not -path "./.next/*" \
#      -not -path "./dist/*" \
#      -not -path "./build/*" \
#      -not -path "./.git/*" | while read -r file; do
    
#     # Check if file is actually empty (double-check)
#     if [ ! -s "$file" ]; then
#         echo -e "${YELLOW}📝 Processing: ${file}${NC}"
        
#         # Add export statement to the file
#         echo "export {};" > "$file"
        
#         # Verify the change was made
#         if [ -s "$file" ]; then
#             echo -e "${GREEN}✅ Added export to: ${file}${NC}"
#             ((count++))
#         else
#             echo -e "${RED}❌ Failed to update: ${file}${NC}"
#         fi
#     fi
# done

# # Final summary
# if [ $count -eq 0 ]; then
#     echo -e "${BLUE}🎉 No empty JavaScript/TypeScript files found!${NC}"
# else
#     echo -e "${GREEN}🎉 Successfully processed ${count} empty files!${NC}"
# fi

# echo -e "${BLUE}💡 You can now run 'pnpm run build' to test your build.${NC}"



#!/bin/bash

# Next.js Project Line Counter
# Counts lines of code by file type, excluding node_modules

echo "🔍 Analyzing Next.js Project..."
echo "=================================="

# Check if we're in a directory
if [ ! -d "." ]; then
    echo "Error: Please run this script from your project directory"
    exit 1
fi

# Function to count lines for a specific file extension
count_lines() {
    local extension="$1"
    local description="$2"
    
    # Find files with the extension, excluding node_modules
    local files=$(find . -name "*.${extension}" -not -path "*/node_modules/*" 2>/dev/null)
    
    if [ -z "$files" ]; then
        echo "  ${description}: 0 files, 0 lines"
        return 0
    fi
    
    local file_count=$(echo "$files" | wc -l)
    local line_count=$(echo "$files" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
    
    # Handle case where wc returns "total" or no output
    if [ -z "$line_count" ] || [ "$line_count" = "total" ]; then
        line_count=$(echo "$files" | xargs cat 2>/dev/null | wc -l)
    fi
    
    echo "  ${description}: ${file_count} files, ${line_count} lines"
    return $line_count
}

# Frontend Files
echo ""
echo "📱 FRONTEND CODE:"
echo "=================="

# TypeScript React files
count_lines "tsx" "TypeScript React (.tsx)"
tsx_lines=$?

# TypeScript files
count_lines "ts" "TypeScript (.ts)"
ts_lines=$?

# JavaScript React files  
count_lines "jsx" "JavaScript React (.jsx)"
jsx_lines=$?

# JavaScript files
count_lines "js" "JavaScript (.js)"
js_lines=$?

# CSS files
count_lines "css" "CSS (.css)"
css_lines=$?

# SCSS/Sass files
count_lines "scss" "SCSS (.scss)"
scss_lines=$?

count_lines "sass" "Sass (.sass)"
sass_lines=$?

# Less files
count_lines "less" "Less (.less)"
less_lines=$?

# Stylus files
count_lines "styl" "Stylus (.styl)"
styl_lines=$?

# Vue files (sometimes used with Next.js)
count_lines "vue" "Vue (.vue)"
vue_lines=$?

# Backend/API Files
echo ""
echo "⚙️  BACKEND/API CODE:"
echo "===================="

# Python files
count_lines "py" "Python (.py)"
py_lines=$?

# PHP files
count_lines "php" "PHP (.php)"
php_lines=$?

# Configuration & Data Files
echo ""
echo "⚙️  CONFIG & DATA FILES:"
echo "========================"

# JSON files
count_lines "json" "JSON (.json)"
json_lines=$?

# YAML files
count_lines "yml" "YAML (.yml)"
yml_lines=$?

count_lines "yaml" "YAML (.yaml)"
yaml_lines=$?

# Environment files
echo "  Environment files:"
env_files=$(find . -name ".env*" -not -path "*/node_modules/*" 2>/dev/null)
if [ ! -z "$env_files" ]; then
    env_count=$(echo "$env_files" | wc -l)
    env_lines=$(echo "$env_files" | xargs cat 2>/dev/null | wc -l)
    echo "    .env files: ${env_count} files, ${env_lines} lines"
else
    echo "    .env files: 0 files, 0 lines"
    env_lines=0
fi

# Configuration files
echo "  Config files:"
config_files=$(find . \( -name "*.config.js" -o -name "*.config.ts" -o -name "*.config.mjs" -o -name "tailwind.config.*" -o -name "next.config.*" -o -name "vite.config.*" -o -name "webpack.config.*" \) -not -path "*/node_modules/*" 2>/dev/null)
if [ ! -z "$config_files" ]; then
    config_count=$(echo "$config_files" | wc -l)
    config_lines=$(echo "$config_files" | xargs cat 2>/dev/null | wc -l)
    echo "    Config files: ${config_count} files, ${config_lines} lines"
else
    echo "    Config files: 0 files, 0 lines"
    config_lines=0
fi

# Markup & Documentation
echo ""
echo "📄 MARKUP & DOCS:"
echo "=================="

# HTML files
count_lines "html" "HTML (.html)"
html_lines=$?

# Markdown files
count_lines "md" "Markdown (.md)"
md_lines=$?

count_lines "mdx" "MDX (.mdx)"
mdx_lines=$?

# Package files
echo ""
echo "📦 PACKAGE FILES:"
echo "=================="

package_files=$(find . -name "package.json" -not -path "*/node_modules/*" 2>/dev/null)
if [ ! -z "$package_files" ]; then
    package_count=$(echo "$package_files" | wc -l)
    package_lines=$(echo "$package_files" | xargs cat 2>/dev/null | wc -l)
    echo "  package.json: ${package_count} files, ${package_lines} lines"
else
    echo "  package.json: 0 files, 0 lines"
    package_lines=0
fi

lockfile_files=$(find . \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" \) -not -path "*/node_modules/*" 2>/dev/null)
if [ ! -z "$lockfile_files" ]; then
    lockfile_count=$(echo "$lockfile_files" | wc -l)
    lockfile_lines=$(echo "$lockfile_files" | xargs cat 2>/dev/null | wc -l)
    echo "  Lock files: ${lockfile_count} files, ${lockfile_lines} lines"
else
    echo "  Lock files: 0 files, 0 lines"
    lockfile_lines=0
fi

# Calculate totals
echo ""
echo "📊 SUMMARY:"
echo "==========="

# Frontend total
frontend_total=$((tsx_lines + ts_lines + jsx_lines + js_lines + css_lines + scss_lines + sass_lines + less_lines + styl_lines + vue_lines))
echo "  Frontend Code: ${frontend_total} lines"

# Backend total  
backend_total=$((py_lines + php_lines))
echo "  Backend Code: ${backend_total} lines"

# Config total
config_total=$((json_lines + yml_lines + yaml_lines + env_lines + config_lines))
echo "  Config & Data: ${config_total} lines"

# Documentation total
docs_total=$((html_lines + md_lines + mdx_lines))
echo "  Documentation: ${docs_total} lines"

# Package files total
package_total=$((package_lines + lockfile_lines))
echo "  Package Files: ${package_total} lines"

# Grand total
grand_total=$((frontend_total + backend_total + config_total + docs_total + package_total))
echo ""
echo "🎯 TOTAL PROJECT LINES: ${grand_total}"

# Additional statistics
echo ""
echo "📈 ADDITIONAL STATS:"
echo "===================="

# Count total files (excluding node_modules)
total_files=$(find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
echo "  Total files (excl. node_modules): ${total_files}"

# Count directories (excluding node_modules)
total_dirs=$(find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
echo "  Total directories: ${total_dirs}"

# Show largest file types by line count
echo ""
echo "🏆 TOP FILE TYPES BY LINES:"
echo "==========================="

# Create associative array for sorting
declare -A file_types
file_types["TypeScript React (.tsx)"]=$tsx_lines
file_types["TypeScript (.ts)"]=$ts_lines
file_types["JavaScript (.js)"]=$js_lines
file_types["JavaScript React (.jsx)"]=$jsx_lines
file_types["JSON (.json)"]=$json_lines
file_types["CSS (.css)"]=$css_lines
file_types["Python (.py)"]=$py_lines
file_types["Markdown (.md)"]=$md_lines
file_types["HTML (.html)"]=$html_lines

# Sort and display top 5
for type in "${!file_types[@]}"; do
    echo "${file_types[$type]} $type"
done | sort -nr | head -5 | while read count type_name; do
    if [ "$count" -gt 0 ]; then
        echo "  ${type_name}: ${count} lines"
    fi
done

echo ""
echo "✅ Analysis complete!"
echo ""
echo "💡 Tip: To exclude additional directories, modify the -not -path patterns in the script"