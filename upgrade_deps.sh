for dep in "$@"
do
    echo "Upgrading to ${dep}@latest"
    yarn add "${dep}@latest";
    git add .
    git commit -m "upgraded ${dep} to the latest version"
done
