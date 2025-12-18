# Testing Guide - Room Rental Platform
**Date:** 2025-12-15  
**Version:** 1.0

## 🎯 Purpose
This guide will help you test all the fixes that have been implemented and verify that the application is working correctly.

---

## 📋 Pre-Testing Checklist

### 1. Ensure Server is Running
```bash
npm run start
```
- Server should be running on `http://localhost:3000`
- Check terminal for any startup errors

### 2. Open Browser Developer Tools
- Press `F12` or right-click → Inspect
- Go to **Console** tab to see logs
- Go to **Network** tab to see API calls

### 3. Have Test Data Ready
You'll need:
- A test user account (or create one during testing)
- Test cities: Mumbai, Delhi, Bangalore, etc.
- Test price ranges: 5000-50000

---

## 🧪 Test Scenarios

### Test 1: Search Functionality ⭐ HIGH PRIORITY

#### What to Test:
The search feature should filter and display rooms based on your criteria.

#### Steps:
1. **Navigate to Search Page**
   - Go to `http://localhost:3000/search`
   - You should see the search page with filters

2. **Test Basic Search (No Filters)**
   - Page should load with initial results
   - **Check Browser Console** - You should see logs like:
     ```
     🔍 [SEARCH] Starting search with filters: {} page: 1
     🔍 [SEARCH] API URL: /api/rooms?sortBy=createdAt&sortOrder=desc&includeSampleData=true&page=1&limit=10
     🔍 [SEARCH] Success! Found X rooms
     ```
   - **Check Server Terminal** - You should see:
     ```
     🔍 [API] GET /api/rooms called
     🔍 [RoomService] searchRooms called with filters: {...}
     🔍 [RoomService] Found X rooms
     ```

3. **Test City Filter**
   - Type "Mumbai" in the City/Location field
   - Select "Mumbai" from dropdown
   - **Expected:** Results should filter to show only Mumbai rooms
   - **Check Console:** Should show city filter being applied

4. **Test Price Range**
   - Set Min Rent: 5000
   - Set Max Rent: 20000
   - **Expected:** Only rooms in this price range should appear
   - **Check Console:** Should show price filters in query

5. **Test Room Type**
   - Select a room type (e.g., "1 BHK")
   - **Expected:** Only that room type should appear

6. **Test Advanced Filters**
   - Click "Show Advanced Filters"
   - Select amenities (WiFi, AC, etc.)
   - **Expected:** Rooms with those amenities should appear

7. **Test Map View**
   - Click "Map" button
   - **Expected:** Map should load with room markers
   - Click on a marker to see room details

#### What Success Looks Like:
✅ Search loads without errors  
✅ Filters update results in real-time  
✅ Console shows detailed logs of search process  
✅ Results display correctly  
✅ "No rooms found" message appears when no matches  
✅ Pagination works if there are many results  

#### If It Fails:
- Check browser console for errors
- Check server terminal for errors
- Look for specific error messages
- Note which filter caused the issue
- Take screenshots of console logs

---

### Test 2: Profile Update & Role Change ⭐ HIGH PRIORITY

#### What to Test:
Users should be able to change their role from "seeker" to "owner" and see the change immediately.

#### Steps:
1. **Sign In**
   - Go to `http://localhost:3000/auth/signin`
   - Sign in with your account

2. **Check Current Role**
   - Go to Dashboard
   - Note your current role (shown in sidebar)

3. **Update Profile**
   - Go to Profile page
   - Find "User Type" dropdown
   - Change from "seeker" to "owner" (or vice versa)
   - Click "Save Changes"
   - **Expected:** Success message appears

4. **Verify Session Refresh**
   - Wait 2-3 seconds
   - Go back to Dashboard
   - **Expected:** Dashboard should now show owner features
   - **Expected:** "Add New Room" button should appear in Quick Actions

5. **Check Console**
   - Should see session update logs
   - No errors should appear

#### What Success Looks Like:
✅ Profile updates successfully  
✅ Success message appears  
✅ Dashboard reflects new role immediately (or after refresh)  
✅ Owner features appear for owners  
✅ Seeker features appear for seekers  

#### If It Fails:
- Try refreshing the page manually
- Check if session is being updated (console logs)
- Sign out and sign in again
- Check server logs for errors

---

### Test 3: Add Room (Owner Only) ⭐ HIGH PRIORITY

#### What to Test:
Owners should be able to create new room listings.

#### Prerequisites:
- You must be signed in
- Your user type must be "owner" (complete Test 2 first)
- Your phone number must be verified (or skip verification for testing)

#### Steps:
1. **Navigate to Dashboard**
   - Go to `http://localhost:3000/dashboard`
   - **Expected:** You should see "Add New Room" button in Quick Actions

2. **Click Add New Room**
   - Click the button
   - **Expected:** Redirects to `/rooms/create`
   - **Expected:** Room creation form appears

3. **Fill Out Form**
   - Enter room title (e.g., "Cozy 1BHK in Mumbai")
   - Enter description
   - Set monthly rent (e.g., 15000)
   - Select room type
   - Enter location details:
     - Address
     - City
     - State
     - Pincode
     - Coordinates (or use map)
   - Select amenities
   - Upload images (optional for testing)

4. **Submit Form**
   - Click "Create Listing" or "Submit"
   - **Expected:** Loading indicator appears
   - **Expected:** Redirects to dashboard with success message

5. **Verify Room Created**
   - Go to Dashboard → My Listings
   - **Expected:** New room appears in your listings

#### What Success Looks Like:
✅ "Add New Room" button is visible to owners  
✅ Form loads without errors  
✅ All fields are editable  
✅ Form validation works  
✅ Submission succeeds  
✅ Room appears in listings  

#### If It Fails:
**If button doesn't appear:**
- Verify your user type is "owner" (check Profile)
- Try signing out and in again
- Check console for permission errors

**If form submission fails:**
- Check browser console for errors
- Check server terminal for errors
- Verify all required fields are filled
- Check if phone verification is required

---

### Test 4: Phone Verification (Optional - Requires Email Setup)

#### Prerequisites:
- Email service must be configured in `.env.local`
- See `EMAIL_SETUP_GUIDE.md` for configuration

#### Steps:
1. **Go to Profile**
   - Navigate to Profile page

2. **Add Phone Number**
   - Enter your phone number
   - Click "Send OTP"

3. **Check for OTP**
   - **If email is configured:** Check your email for OTP
   - **If email is NOT configured:** You'll see an error message explaining email is not set up

4. **Enter OTP**
   - Enter the OTP from email
   - Click "Verify"
   - **Expected:** Phone number is verified

#### What Success Looks Like:
✅ OTP is sent to email  
✅ OTP can be entered and verified  
✅ Phone number shows as verified  

#### If It Fails:
- Check `.env.local` for email configuration
- Check server logs for email errors
- See `EMAIL_SETUP_GUIDE.md` for setup instructions

---

## 🔍 Debugging Tips

### Browser Console Logs
Look for logs with these prefixes:
- `🔍 [SEARCH]` - Client-side search logs
- `🔍 [API]` - API endpoint logs
- `🔍 [RoomService]` - Database service logs

### Server Terminal Logs
Watch for:
- Database connection messages
- API request logs
- Error stack traces
- MongoDB query logs

### Common Issues

#### Issue: "No rooms found"
**Possible Causes:**
1. Database is empty (no rooms created yet)
2. Filters are too restrictive
3. Sample data is excluded

**Solutions:**
- Try searching without filters
- Add `includeSampleData=true` to URL
- Create some test rooms first

#### Issue: Search doesn't update
**Possible Causes:**
1. JavaScript error in console
2. API endpoint not responding
3. Database connection issue

**Solutions:**
- Check browser console for errors
- Check Network tab for failed requests
- Verify MongoDB is running
- Check server terminal for errors

#### Issue: Can't create room
**Possible Causes:**
1. Not signed in
2. User type is not "owner"
3. Phone not verified
4. Form validation errors

**Solutions:**
- Verify you're signed in
- Change user type to "owner" in Profile
- Check console for specific error messages
- Ensure all required fields are filled

---

## 📊 Test Results Template

Use this template to record your test results:

```
### Test Results - [Date]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Node Version: [version]
- MongoDB: [Running/Not Running]

**Test 1: Search Functionality**
- Status: [✅ Pass / ❌ Fail]
- Notes: [Any observations]
- Issues: [List any issues found]

**Test 2: Profile Update**
- Status: [✅ Pass / ❌ Fail]
- Notes: [Any observations]
- Issues: [List any issues found]

**Test 3: Add Room**
- Status: [✅ Pass / ❌ Fail]
- Notes: [Any observations]
- Issues: [List any issues found]

**Test 4: Phone Verification**
- Status: [✅ Pass / ❌ Fail / ⏭️ Skipped]
- Notes: [Any observations]
- Issues: [List any issues found]

**Overall Status:**
[Summary of testing session]
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
1. Document any observations
2. Test additional edge cases
3. Consider adding more test data
4. Review and update documentation

### If Tests Fail:
1. Note the exact error messages
2. Capture console logs (browser and server)
3. Take screenshots
4. Document steps to reproduce
5. Report issues with:
   - What you did
   - What you expected
   - What actually happened
   - Console logs
   - Screenshots

---

## 📞 Getting Help

If you encounter issues:

1. **Check Documentation:**
   - `BUGS_AND_FIXES.md` - Known issues and fixes
   - `FIXES_SUMMARY.md` - Summary of fixes
   - `COMPREHENSIVE_FIX_PLAN.md` - Detailed fix plan

2. **Check Logs:**
   - Browser console (F12)
   - Server terminal
   - Network tab in DevTools

3. **Gather Information:**
   - Exact error messages
   - Steps to reproduce
   - Browser and environment details
   - Screenshots

---

**Last Updated:** 2025-12-15 11:47 IST  
**Version:** 1.0
