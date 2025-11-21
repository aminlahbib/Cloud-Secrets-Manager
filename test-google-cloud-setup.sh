#!/bin/bash

# Google Cloud Identity Platform Setup Test Script
# This script helps you verify your Google Cloud setup

echo "🔍 Testing Google Cloud Identity Platform Setup"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Service Account File
echo "1️⃣  Checking service account file..."
if [ -f "secret-service/src/main/resources/service-account.json" ]; then
    echo -e "${GREEN}✅ Service account file exists${NC}"
    
    # Check if it's valid JSON
    if python3 -m json.tool secret-service/src/main/resources/service-account.json > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Service account file is valid JSON${NC}"
        
        # Extract project ID
        PROJECT_ID=$(cat secret-service/src/main/resources/service-account.json | grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$PROJECT_ID" ]; then
            echo -e "${GREEN}   Project ID: $PROJECT_ID${NC}"
        fi
    else
        echo -e "${RED}❌ Service account file is not valid JSON${NC}"
    fi
else
    echo -e "${RED}❌ Service account file NOT found${NC}"
    echo "   Expected location: secret-service/src/main/resources/service-account.json"
fi

echo ""

# Check 2: Application Configuration
echo "2️⃣  Checking application configuration..."
if grep -q "google:" secret-service/src/main/resources/application.yml && grep -q "cloud:" secret-service/src/main/resources/application.yml && grep -q "identity:" secret-service/src/main/resources/application.yml; then
    # Check for enabled flag (could be in format: enabled: ${GOOGLE_IDENTITY_ENABLED:true})
    ENABLED_LINE=$(grep -A 5 "google:" secret-service/src/main/resources/application.yml | grep -i "enabled" | head -1)
    if echo "$ENABLED_LINE" | grep -q "true"; then
        echo -e "${GREEN}✅ Google Identity Platform is enabled${NC}"
    elif echo "$ENABLED_LINE" | grep -q "false"; then
        echo -e "${YELLOW}⚠️  Google Identity Platform is disabled${NC}"
        echo "   Set google.cloud.identity.enabled: true in application.yml"
    else
        echo -e "${GREEN}✅ Google Identity Platform configuration found${NC}"
        echo "   (Using environment variable: GOOGLE_IDENTITY_ENABLED, default: true)"
    fi
else
    echo -e "${YELLOW}⚠️  Could not find google.cloud.identity configuration in application.yml${NC}"
fi

# Check project ID
PROJECT_ID_CONFIG=$(grep "project-id" secret-service/src/main/resources/application.yml | grep -o "cloud-secrets-manager[^\"]*" | head -1)
if [ ! -z "$PROJECT_ID_CONFIG" ]; then
    echo -e "${GREEN}   Project ID configured: $PROJECT_ID_CONFIG${NC}"
fi

echo ""

# Check 3: Application Running
echo "3️⃣  Checking if application is running..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is running on port 8080${NC}"
    
    # Check health endpoint
    HEALTH=$(curl -s http://localhost:8080/actuator/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "UP" ]; then
        echo -e "${GREEN}   Health status: $HEALTH${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Application is not running${NC}"
    echo "   Start it with: cd secret-service && ./mvnw spring-boot:run"
fi

echo ""

# Check 4: Google Cloud Console Links
echo "4️⃣  Google Cloud Console Links:"
echo "   📊 Console: https://console.cloud.google.com"
echo "   👥 Identity Platform Users: https://console.cloud.google.com/customer-identity/users"
echo "   🔑 Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts"
echo "   📚 APIs: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com"

echo ""

# Summary
echo "📋 Next Steps:"
echo "   1. Open Google Cloud Console: https://console.cloud.google.com"
echo "   2. Select your project: $PROJECT_ID"
echo "   3. Go to Identity Platform → Users"
echo "   4. Create a test user or use your API to create one"
echo "   5. Get ID token using: postman/get-id-token.html"
echo "   6. Test login: POST http://localhost:8080/api/auth/login"

echo ""
echo "📖 For detailed instructions, see: docs/current/GOOGLE_CLOUD_TESTING_GUIDE.md"
echo ""

