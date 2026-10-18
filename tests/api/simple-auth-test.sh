#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== CareerForge AI API Tests ==="
echo "Testing against: $BASE_URL"
echo ""

# Test 1: Unauthenticated /api/auth/me
echo "Test 1: GET /api/auth/me (unauthenticated)"
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 5 "$BASE_URL/api/auth/me" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Returns 401 for unauthenticated request"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 2: Unauthenticated /api/profile
echo "Test 2: GET /api/profile (unauthenticated)"
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 5 "$BASE_URL/api/profile" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Returns 401 for unauthenticated request"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 3: Unauthenticated /api/career/roles
echo "Test 3: GET /api/career/roles (unauthenticated)"
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 5 "$BASE_URL/api/career/roles" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Returns 401 for unauthenticated request"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
fi
echo ""

# Test 4: Homepage
echo "Test 4: GET / (homepage)"
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 5 "$BASE_URL/" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PASS: Homepage returns 200"
else
  echo "❌ FAIL: Expected 200, got $HTTP_CODE"
fi
echo ""

echo "=== Tests Complete ==="
