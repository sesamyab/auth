#!/bin/bash

# Source and destination directories
SOURCE_DIR="src/adapters/drizzle-sqlite"
DESTINATION_DIR="src/adapters/drizzle-mysql"

# Strings to be replaced
SQLITE_STRING="sqlite"
MYSQL_STRING="mysql"
SQLITE_CAP_STRING="SQLite"
MYSQL_CAP_STRING="Mysql"

# Warning message to be added at the top of each file
WARNING_MESSAGE="// WARNING - this file is generated from the SQLite adapter. Do not edit!"

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

# Create the destination directory if it doesn't exist
mkdir -p "$DESTINATION_DIR"

# Function to copy and replace strings in a file and add a warning message
copy_and_replace() {
    local src_file="$1"
    local dest_file="$2"
    
    # Ensure the destination directory exists
    mkdir -p "$(dirname "$dest_file")"
    
    # Prepend the warning message, then copy the file and replace the strings
    {
        echo "$WARNING_MESSAGE"
        sed -e "s/$SQLITE_STRING/$MYSQL_STRING/g" -e "s/$SQLITE_CAP_STRING/$MYSQL_CAP_STRING/g" "$src_file"
    } > "$dest_file"
}

# Export variables and function to make them available in subshells
export -f copy_and_replace
export SOURCE_DIR DESTINATION_DIR SQLITE_STRING MYSQL_STRING SQLITE_CAP_STRING MYSQL_CAP_STRING WARNING_MESSAGE

# Find all files in the source directory and subdirectories
# For each file, call copy_and_replace
find "$SOURCE_DIR" -type f -exec bash -c 'copy_and_replace "{}" "${@/#$SOURCE_DIR/$DESTINATION_DIR}"' _ {} \;

echo "Files copied and strings replaced successfully."
