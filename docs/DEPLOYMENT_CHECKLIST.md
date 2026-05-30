# Tool-Based Chat Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] Supabase project is created and accessible
- [ ] Supabase CLI is installed (`npm install -g supabase`)
- [ ] Logged into Supabase CLI (`supabase login`)
- [ ] Linked to project (`supabase link --project-ref YOUR_PROJECT_REF`)

### 2. Secrets Configuration
- [ ] GEMINI_API_KEY is set in Supabase
  ```bash
  supabase secrets set GEMINI_API_KEY=your_gemini_api_key
  ```
- [ ] SUPABASE_URL is set (usually auto-configured)
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (usually auto-configured)
- [ ] Verify secrets:
  ```bash
  supabase secrets list
  ```

### 3. Database Preparation
- [ ] Run migrations to ensure tables exist:
  ```bash
  supabase db push
  ```
- [ ] Verify tables exist:
  - `shops` table
  - `products` table
  - `orders` table (optional for now)
- [ ] Check RLS status:
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```

### 4. Security Review
- [ ] Review RLS policies on `shops` table
- [ ] **CRITICAL:** Enable RLS on `products` table:
  ```sql
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  
  -- Allow public read access
  CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  TO public
  USING (true);
  ```
- [ ] Review RLS policies on `orders` table
- [ ] Confirm service role key is not exposed in client code

---

## Deployment Steps

### Step 1: Deploy Edge Function
```bash
cd supabase/functions
supabase functions deploy chat-with-tools
```

**Expected Output:**
```
Deploying chat-with-tools (project ref: YOUR_PROJECT_REF)
✓ Deployed chat-with-tools
```

**Verify:**
- [ ] Function appears in Supabase Dashboard → Edge Functions
- [ ] Function status is "Active"

### Step 2: Test Edge Function
```bash
# Using test script
node test-tool-chat.cjs "Show me all shops"

# Or using curl
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/chat-with-tools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"messages":[{"role":"user","content":"Show me all shops"}]}'
```

**Expected Response:**
```json
{
  "reply": "I found X shops in the database: ...",
  "usage": {
    "promptTokenCount": 123,
    "candidatesTokenCount": 45,
    "totalTokenCount": 168
  }
}
```

**Verify:**
- [ ] Response contains shop data
- [ ] No error messages
- [ ] Response time < 3 seconds

### Step 3: Deploy Frontend
```bash
# Build production bundle
npm run build

# Deploy to Vercel (or your hosting platform)
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

**Verify:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Bundle size is reasonable (< 500KB gzipped)

### Step 4: Integration Testing
- [ ] Navigate to `/ai-chat` route (if using Option 1)
- [ ] Test floating widget (if using Option 2)
- [ ] Test in production environment

**Test Cases:**
1. [ ] "Show me all shops" → Lists shops from database
2. [ ] "What products are available?" → Lists products
3. [ ] "Tell me about [shop name]" → Shows shop details
4. [ ] "How does Sales Brain AI work?" → General response (no tool call)
5. [ ] Invalid shop ID → Graceful error handling
6. [ ] Empty database → Clear "no data" message

---

## Post-Deployment

### 1. Monitoring Setup
- [ ] Check Edge Function logs:
  ```bash
  supabase functions logs chat-with-tools
  ```
- [ ] Set up error alerts in Supabase Dashboard
- [ ] Monitor API usage in Google AI Studio (Gemini)
- [ ] Track response times

### 2. Performance Optimization
- [ ] Review average response time (target: < 2 seconds)
- [ ] Check database query performance
- [ ] Consider adding caching for frequently accessed data
- [ ] Monitor Gemini API token usage

### 3. Security Audit
- [ ] Verify no API keys in client-side code
- [ ] Confirm RLS is enabled on sensitive tables
- [ ] Test with different user roles
- [ ] Review CORS configuration

### 4. Documentation
- [ ] Update README.md with new feature
- [ ] Add usage examples to docs
- [ ] Document any custom tools added
- [ ] Update API documentation

---

## Rollback Plan

If issues occur, follow these steps:

### 1. Disable Edge Function
```bash
# Delete the function
supabase functions delete chat-with-tools
```

### 2. Revert Frontend Changes
```bash
# Revert to previous commit
git revert HEAD

# Redeploy
vercel --prod
```

### 3. Restore Database (if needed)
```bash
# Restore from backup
supabase db restore --backup-id BACKUP_ID
```

---

## Troubleshooting

### Issue: "GEMINI_API_KEY not configured"
**Solution:**
```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase functions deploy chat-with-tools
```

### Issue: "Failed to fetch" or CORS errors
**Solution:**
- Check `_shared/cors.ts` is properly configured
- Verify Edge Function is deployed
- Check browser console for specific error

### Issue: Empty or incorrect responses
**Solution:**
- Check Edge Function logs: `supabase functions logs chat-with-tools`
- Verify database has data: `SELECT COUNT(*) FROM shops;`
- Test Gemini API key in Google AI Studio

### Issue: Slow response times (> 5 seconds)
**Solution:**
- Check database query performance
- Add indexes to frequently queried columns
- Consider caching frequently accessed data
- Review Gemini model choice (use `gemini-2.0-flash-exp` for speed)

### Issue: Tool calls not working
**Solution:**
- Verify Gemini model supports function calling
- Check tool definitions in Edge Function
- Review system instruction clarity
- Test with explicit tool-triggering prompts

---

## Success Metrics

After deployment, monitor these metrics:

### Performance
- [ ] Average response time < 2 seconds
- [ ] 95th percentile response time < 4 seconds
- [ ] Error rate < 1%

### Usage
- [ ] Daily active users
- [ ] Messages per session
- [ ] Tool call frequency
- [ ] Most common queries

### Cost
- [ ] Gemini API token usage
- [ ] Edge Function invocations
- [ ] Database query count
- [ ] Estimated monthly cost

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Review user feedback

### Weekly
- [ ] Analyze usage patterns
- [ ] Review API costs
- [ ] Update documentation if needed

### Monthly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Feature enhancement planning
- [ ] Backup verification

---

## Contact & Support

**Issues:** Create issue in GitHub repository  
**Documentation:** See `docs/TOOL_CHAT.md`  
**Architecture:** See `docs/ARCHITECTURE.md`  
**Examples:** See `docs/INTEGRATION_EXAMPLES.tsx`

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** 1.0.0  
**Status:** ☐ Pending  ☐ In Progress  ☐ Complete  ☐ Rolled Back
