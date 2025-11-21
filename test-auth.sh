#!/bin/bash

# Quick authentication test script

set -e

BASE_URL="http://localhost:8080"
EMAIL="amine.lhb@gmail.com"

echo "🧪 Testing Authentication Flow"
echo "=============================="
echo ""

# Check if app is running
echo "📡 Checking application..."
if ! curl -s $BASE_URL/actuator/health > /dev/null 2>&1; then
    echo "❌ Application is not running!"
    exit 1
fi
echo "✅ Application is running"
echo ""

# Check health
echo "🏥 Health check..."
HEALTH=$(curl -s $BASE_URL/actuator/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "Status: $HEALTH"
echo ""

echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Get Google ID Token:"
echo "   - Use Firebase SDK in browser console"
echo "   - Or use the script in: postman/get-token.js"
echo ""
echo "2. Test Login:"
echo "   curl -X POST $BASE_URL/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"idToken\": \"YOUR_ID_TOKEN_HERE\"}'"
echo ""
echo "3. Use Postman:"
echo "   - Import collection from postman/ folder"
echo "   - Set google_id_token in environment"
echo "   - Run 'Login with Google ID Token'"
echo "   - Then test all endpoints"
echo ""
echo "4. Or continue with next feature:"
echo "   - Testing Infrastructure (Priority 2)"
echo "   - JWT Refresh Tokens (Priority 3)"
echo "   - Secret Versioning (Priority 4)"
echo ""

