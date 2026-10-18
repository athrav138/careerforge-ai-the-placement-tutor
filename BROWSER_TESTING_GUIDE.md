# CareerForge AI - Browser Testing Guide

**Date:** 2026-10-18
**Test Account:** test@careerforge.local / TestPass123!
**Server URL:** http://localhost:3000
**Note:** Development server is currently running

---

## Phase 1: Authentication Flow

### Test 1.1: Registration
**Steps:**
1. Navigate to http://localhost:3000/register
2. Fill in the form:
   - Name: Test User
   - Email: test@careerforge.local
   - Password: TestPass123!
   - Confirm Password: TestPass123!
3. Click "Create Account"
4. Observe the result

**Expected Behavior:**
- If email verification is disabled: Redirect to /dashboard
- If email verification is enabled: Show message to verify email
- No error messages
- Check browser console for errors (F12 → Console)

**Check Server Logs:**
- Look for any errors in the terminal running `npm run dev`

---

### Test 1.2: Login with Valid Credentials
**Steps:**
1. Navigate to http://localhost:3000/login
2. Fill in:
   - Email: test@careerforge.local
   - Password: TestPass123!
3. Click "Sign In"
4. Observe the result

**Expected Behavior:**
- Redirect to /dashboard
- Welcome message shows "Test User"
- No error messages
- Check browser cookies (F12 → Application → Cookies) for session cookie

---

### Test 1.3: Login with Invalid Credentials
**Steps:**
1. Navigate to http://localhost:3000/login
2. Fill in:
   - Email: test@careerforge.local
   - Password: WrongPassword123
3. Click "Sign In"
4. Observe the result

**Expected Behavior:**
- Stay on login page
- Show error: "Email or password is incorrect."
- No redirect occurs

---

### Test 1.4: Session Persistence
**Steps:**
1. Log in successfully (Test 1.2)
2. Navigate to /dashboard
3. Refresh the page (F5 or Ctrl+R)
4. Observe the result

**Expected Behavior:**
- Stay logged in
- Dashboard content remains visible
- No redirect to login page
- Welcome message still shows "Test User"

---

### Test 1.5: Logout
**Steps:**
1. While logged in, find logout option (likely in header or settings)
2. Click logout
3. Observe the result

**Expected Behavior:**
- Redirect to /login or home page
- Session cookie cleared
- Attempting to access /dashboard redirects to login

---

### Test 1.6: Protected Route Access
**Steps:**
1. Log out (if logged in)
2. Directly navigate to http://localhost:3000/dashboard
3. Observe the result

**Expected Behavior:**
- Redirect to /login
- Show message indicating authentication required

---

### Test 1.7: Password Reset Flow
**Steps:**
1. Navigate to http://localhost:3000/forgot-password
2. Enter email: test@careerforge.local
3. Click submit
4. Observe the result

**Expected Behavior:**
- Show message: "If an account exists for that email, a reset link will arrive shortly."
- No error messages

---

## Phase 2: Profile & Onboarding

### Test 2.1: Profile Creation (Onboarding)
**Steps:**
1. Log in with test account
2. If not redirected to /onboarding, navigate there manually
3. Fill in the profile form with test data:
   - Phone: 1234567890
   - Location: Test City
   - College: Test University
   - Degree: Computer Science
   - Branch: CS
   - Year: 2025
   - CGPA: 8.5
   - Skills: JavaScript, React, Node.js, Python, SQL
   - Target Role: Full Stack Developer
   - Interests: Web Development
   - Preferred Domain: Software
   - Preferred Job Type: Full-time
   - Programming Languages: JavaScript, Python
   - Frameworks: React, Next.js
   - Databases: PostgreSQL, MongoDB
   - Tools: Git, Docker
   - Certifications: AWS Certified
   - Projects: E-commerce App, Blog Platform
   - Experience: 2 years freelance
   - GitHub: https://github.com/testuser
   - LinkedIn: https://linkedin.com/in/testuser
   - Portfolio: https://testuser.dev
4. Click "Save Profile"
5. Observe the result

**Expected Behavior:**
- Show success message
- Redirect to /dashboard
- No error messages
- Check browser console for errors

---

### Test 2.2: Profile Data Persistence
**Steps:**
1. After saving profile (Test 2.1), refresh the page (F5)
2. Navigate to /dashboard/profile
3. Observe the result

**Expected Behavior:**
- All saved data is displayed
- Values match what was entered
- No data loss

---

### Test 2.3: Profile Update
**Steps:**
1. Navigate to /dashboard/profile
2. Modify one field (e.g., change "Phone" to "9876543210")
3. Click "Save"
4. Refresh the page
5. Observe the result

**Expected Behavior:**
- Change is saved
- Updated value persists after refresh

---

### Test 2.4: Logout and Re-login Persistence
**Steps:**
1. Log out
2. Log in again with test account
3. Navigate to /dashboard/profile
4. Observe the result

**Expected Behavior:**
- Profile data is still present
- All previously saved values are intact

---

## Phase 3: Career Preparation Modules

### Test 3.1: Career Recommendations
**Steps:**
1. Navigate to /dashboard/career
2. Observe the career recommendations
3. Click on a recommended role
4. Observe the skill gap analysis

**Expected Behavior:**
- Career roles are displayed
- Match percentages are shown
- Required skills are listed
- Missing skills are identified
- No error messages

---

### Test 3.2: Skill Gap Analysis
**Steps:**
1. Navigate to /dashboard/skills
2. View the skill gap analysis
3. Check which skills are marked as missing/weak
4. Observe the visualization

**Expected Behavior:**
- Saved skills are displayed
- Target role requirements are shown
- Skill gaps are clearly identified
- Visual representation is accurate

---

### Test 3.3: Learning Roadmap
**Steps:**
1. Navigate to /dashboard/roadmap
2. Observe the generated roadmap
3. Check if tasks are listed
4. Try marking a task as complete (if available)
5. Observe progress update

**Expected Behavior:**
- Roadmap is generated based on skill gaps
- Learning tasks are listed with resources
- Progress tracking works
- No error messages

---

### Test 3.4: Resume Upload (Optional - Requires File)
**Steps:**
1. Navigate to /dashboard/resume
2. Click "Upload Resume"
3. Select a test PDF or DOCX file
4. Wait for upload
5. Observe the analysis results

**Expected Behavior:**
- File uploads successfully
- Analysis begins automatically
- ATS score is displayed
- Improvement suggestions are shown
- No timeout errors

**Alternative if no file available:**
- Observe empty state handling
- Check if upload form is properly displayed

---

### Test 3.5: Aptitude Assessment
**Steps:**
1. Navigate to /dashboard/aptitude
2. Click "Start Assessment"
3. Answer a few questions (don't need to complete all)
4. Submit the attempt
5. View results

**Expected Behavior:**
- Questions load correctly
- Answers are accepted
- Score is calculated
- Results are displayed
- Weak skills are identified

---

### Test 3.6: Interview Practice
**Steps:**
1. Navigate to /dashboard/interview
2. Click "Start Interview"
3. Answer a few interview questions
4. Submit the session
5. View AI feedback

**Expected Behavior:**
- Interview questions load
- Answers are accepted
- AI provides feedback
- Results are saved
- No API errors

---

## Phase 4: Integrations

### Test 4.1: GitHub Integration
**Steps:**
1. Navigate to /dashboard/github
2. Observe the connection status
3. If not connected, try connecting (requires actual GitHub account)
4. Observe the result

**Expected Behavior:**
- Connection status is clear
- If not connected, shows appropriate message
- Connection flow is initiated (if attempted)
- No authentication errors

---

### Test 4.2: LinkedIn Integration
**Steps:**
1. Navigate to /dashboard/linkedin
2. Observe the import status
3. If not imported, try importing (requires actual LinkedIn account)
4. Observe the result

**Expected Behavior:**
- Import status is clear
- If not imported, shows appropriate message
- Import flow is initiated (if attempted)
- No authentication errors

---

## Phase 5: Dashboard Analytics

### Test 5.1: Dashboard Overview
**Steps:**
1. Navigate to /dashboard
2. Observe all dashboard widgets
3. Check readiness score
4. Check component scores
5. Check recommendations

**Expected Behavior:**
- All widgets load
- Readiness score is displayed
- Component scores are accurate
- Recommendations are relevant
- No loading errors

---

### Test 5.2: Notifications
**Steps:**
1. Check for notification indicator
2. Click on notifications
3. Observe the list

**Expected Behavior:**
- Notifications are displayed (if any)
- Can mark as read
- No error messages

---

## Phase 6: Error Handling & Edge Cases

### Test 6.1: Empty States
**Steps:**
1. Check modules with no data (e.g., resume if not uploaded)
2. Observe empty state messages

**Expected Behavior:**
- Clear empty state messages
- Calls to action are provided
- No broken UI

---

### Test 6.2: Invalid Inputs
**Steps:**
1. Try submitting profile with invalid year (e.g., "abc")
2. Try submitting with invalid CGPA (e.g., "15")
3. Observe validation errors

**Expected Behavior:**
- Validation errors are shown
- Form doesn't submit invalid data
- Error messages are clear

---

### Test 6.3: Network Errors (Simulated)
**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Try an action (e.g., save profile)
5. Observe error handling

**Expected Behavior:**
- Error message is shown
- App doesn't crash
- Can retry after restoring connection

---

## Phase 7: Cross-User Isolation

### Test 7.1: Data Isolation
**Steps:**
1. Log out of test account
2. Create a second test account (test2@careerforge.local)
3. Save different profile data
4. Log out
5. Log back in as test@careerforge.local
6. Check profile data

**Expected Behavior:**
- test@careerforge.local sees only their own data
- No data from test2@careerforge.local is visible
- User isolation is maintained

---

## Test Results Recording

For each test, record:
- ✅ PASSED - Worked as expected
- ❌ FAILED - Did not work as expected
- ⚠️ PARTIAL - Partially worked
- ⏭️ SKIPPED - Not tested (e.g., no file available)

### Authentication Results
- [ ] Test 1.1: Registration
- [ ] Test 1.2: Login (Valid)
- [ ] Test 1.3: Login (Invalid)
- [ ] Test 1.4: Session Persistence
- [ ] Test 1.5: Logout
- [ ] Test 1.6: Protected Routes
- [ ] Test 1.7: Password Reset

### Profile Results
- [ ] Test 2.1: Profile Creation
- [ ] Test 2.2: Profile Persistence
- [ ] Test 2.3: Profile Update
- [ ] Test 2.4: Logout/Re-login Persistence

### Career Module Results
- [ ] Test 3.1: Career Recommendations
- [ ] Test 3.2: Skill Gap Analysis
- [ ] Test 3.3: Learning Roadmap
- [ ] Test 3.4: Resume Upload
- [ ] Test 3.5: Aptitude Assessment
- [ ] Test 3.6: Interview Practice

### Integration Results
- [ ] Test 4.1: GitHub Integration
- [ ] Test 4.2: LinkedIn Integration

### Analytics Results
- [ ] Test 5.1: Dashboard Overview
- [ ] Test 5.2: Notifications

### Error Handling Results
- [ ] Test 6.1: Empty States
- [ ] Test 6.2: Invalid Inputs
- [ ] Test 6.3: Network Errors

### Security Results
- [ ] Test 7.1: Data Isolation

---

## Server Log Monitoring

While testing, keep the development server terminal visible and note any errors:

**Error Patterns to Watch For:**
- Database connection errors
- Neon Auth errors
- API timeouts
- Unhandled exceptions
- 500 Internal Server Error responses

---

## Next Steps After Testing

1. Update VERIFICATION_REPORT.md with actual test results
2. Document any bugs or issues found
3. Prioritize fixes based on severity
4. Re-test after fixes
5. Run final production build
6. Prepare for deployment
