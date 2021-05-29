if [ $1 == "dep" ]
then
    for dep in "${@:2}"
    do
        echo "Upgrading to ${dep}@latest"
        yarn add "${dep}@latest";
        git add .
        git commit -m "upgraded ${dep} to the latest version"
    done
elif [ $1 == "dev" ]
then
    for dep in "${@:2}"
    do
        echo "Upgrading to ${dep}@latest"
        yarn add -D "${dep}@latest";
        git add .
        git commit -m "upgraded ${dep} to the latest version"
    done
else
echo "nothing"
fi
