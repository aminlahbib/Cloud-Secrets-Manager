#!/bin/bash
# Script to set Java 21 for this project
# Usage: source scripts/dev/set-java-21.sh

export JAVA_HOME=/Users/amine/Library/Java/JavaVirtualMachines/ms-21.0.9/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

echo "Java version set to:"
java -version

echo ""
echo "JAVA_HOME: $JAVA_HOME"
echo ""
echo "You can now run Maven commands. The Java version will be used for this session."
echo "To make it permanent, add these lines to your ~/.zshrc:"
echo ""
echo "export JAVA_HOME=/Users/amine/Library/Java/JavaVirtualMachines/ms-21.0.9/Contents/Home"
echo "export PATH=\$JAVA_HOME/bin:\$PATH"

