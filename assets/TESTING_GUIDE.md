# Jason Assistant - Testing Guide

## Quick Test Scenarios

### 1. Basic Functionality
1. Open `index.html` in browser
2. Click the chat bubble (💬) in bottom-right
3. Chat window should open with welcome message
4. Initial suggestions should be visible at top

### 2. Test Intent Detection
Try these queries to test different intents:

**Greeting**:
- "Hi"
- "Hello"
- "Good morning"

**Fun Facts**:
- "Tell me a fun fact"
- "Something interesting"

**Time/Date**:
- "What time is it?"
- "What's today's date?"

**Chat Stats**:
- "How long have we been talking?"
- "Chat stats"

**AWS Hackathon**:
- "Tell me about AWS Hackathon"
- "Bay management system"
- "re:Invent"

**HAECO Co-op**:
- "What did Jason do at HAECO?"
- "Co-op experience"
- "Internship"

**Skills**:
- "What are his skills?"
- "Programming languages"

**Education**:
- "Where did he study?"
- "HKUST"

**Projects**:
- "Show me his projects"
- "Portfolio"

**Awards**:
- "What awards did he win?"
- "Achievements"

**Contact**:
- "How to contact Jason?"
- "Email"

**Navigation**:
- "Go to hackathon page"
- "Show me HAECO page"

### 3. Test Response Variety
Ask the same question 3 times:
1. "Hi" → Should get variant 1
2. "Hello" → Should get variant 2 (different from #1)
3. "Hey" → Should get variant 3 (different from #1 and #2)

### 4. Test Loop Detection
Ask the same question 3+ times in a row:
1. "AWS Hackathon"
2. "AWS Hackathon"
3. "AWS Hackathon" → Should trigger loop detection message

### 5. Test Dynamic Suggestions
1. Ask any question
2. Check that 3-5 suggestion chips appear below bot response
3. Click a suggestion chip
4. Should auto-fill input and send message
5. New suggestions should appear (different from previous)

### 6. Test Scroll Behavior
1. Ask a question with long response (e.g., "Tell me about Jason")
2. Bot response should scroll to TOP of chat viewport
3. You should be able to scroll down to read the full answer
4. Suggestions should be visible at bottom of message

### 7. Test Knowledge Retrieval
Ask questions that should match knowledge base:
- "Tell me about the 14-day build"
- "What about Techathon?"
- "Lean Day MC"
- "Media interviews"

### 8. Test Fallback
1. Open browser console (F12)
2. Check for any errors
3. If knowledge.json fails to load, chatbot should still work with hardcoded responses

### 9. Test Mobile Responsiveness
1. Resize browser window to mobile size (< 768px)
2. Chat window should adapt to screen size
3. Suggestions should wrap properly
4. All buttons should be clickable

### 10. Test Action Buttons
1. Ask "Tell me about AWS Hackathon"
2. Click "View Full Project Details" button
3. Should navigate to hackathon.html
4. Go back and test other action buttons

## Expected Behaviors

✅ **Correct**:
- Suggestions appear after every bot message
- Bot messages scroll to top
- User messages scroll to bottom
- No repeated responses for same intent
- Loop detection after 3 same intents
- Smooth animations
- All buttons clickable

❌ **Incorrect**:
- No suggestions appearing
- Same response repeated immediately
- Chat scrolling to bottom for bot messages
- Suggestions not clickable
- Console errors
- Broken navigation links

## Browser Compatibility

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Checks

- Knowledge base loads in < 100ms
- Retrieval completes in < 50ms
- Typing indicator shows for 800ms
- Smooth scroll animations
- No lag when clicking suggestions

## Debugging Tips

If something doesn't work:

1. **Check Console**: Open F12 → Console tab
2. **Check Network**: F12 → Network tab → Look for knowledge.json
3. **Check Elements**: F12 → Elements → Inspect chat DOM
4. **Clear Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. **Test Locally**: Use Live Server or local web server

## Common Issues

**Issue**: Suggestions not appearing
**Fix**: Check that response includes `suggestions` array

**Issue**: Knowledge base not loading
**Fix**: Check file path `assets/bot/knowledge.json` exists

**Issue**: Scroll not working
**Fix**: Check `scrollIntoView` is called for bot messages

**Issue**: Loop detection not triggering
**Fix**: Check `intentHistory` is tracking correctly

---

**Happy Testing!** 🚀

Report any issues or unexpected behaviors for quick fixes.
