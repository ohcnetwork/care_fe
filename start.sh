#!/bin/sh

ENV_FILE=config_temp.json
ENV_PREFIX="CARE_FE__"
# Get only the environment variables that start with CARE_FE
env_vars=$(env | grep -E "^$ENV_PREFIX")
# Search and replace the CARE_FE prefix with an empty string
env_vars=$(echo "$env_vars" | sed -e "s/^$ENV_PREFIX//g")

json_string="{"
# iterate over the environment variables
for env_var in $env_vars; do
    # Get the key and value
    key=$(echo "$env_var" | cut -d '=' -f 1)
    value=$(echo "$env_var" | cut -d '=' -f 2)
    # Add key and value to JSON string, enclosing value in double quotes unless it is the string "true" or "false
    if [ "$value" = "true" ] || [ "$value" = "false" ]; then
        json_string="$json_string\"$key\":$value,"
    else
        json_string="$json_string\"$key\":\"$value\","
    fi
done

# replace last character from json_string
json_string=$(echo "$json_string" | sed 's/.$/}/')

# Write to files
echo "$json_string" >$ENV_FILE

if [ -z "$env_vars" ]; then
  ENV_FILE=config.json
fi

echo "Copying $ENV_FILE to config.json"

# cp $ENV_FILE config.json
if ! cp /usr/share/nginx/html/$ENV_FILE /usr/share/nginx/html/config.json; then
  >&2 echo "Error: Failed to update the final configuration file."
fi
exit 0
