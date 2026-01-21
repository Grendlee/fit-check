# Inspiration
Finding a fit can be tedious and daunting, especially if you have lots of clothes, and your friend is too busy to help. FitCheck uses software to give fit checks so you don’t have to ask your friend every time you get dressed.

# What it does
Select a style and let FitCheck rate your look. It uses AI to store keywords and descriptions to match your selected style to your wardrobe, ensuring you hit the aesthetic you're aiming for.

# How we built it
The project was built using the Gemini API, Lovable, Next.js, TypeScript, and Supabase. We utilized Python for efficient token usage when populating the database with style data.

# Challenges we ran into
Using the Gemini API to populate descriptions and keywords for images consumes a significant amount of tokens. To manage this, we used AI chat and Python scripts to steer around expensive API calls and optimize our data processing.

# Accomplishments that we're proud of
We successfully implemented the usage of Google Gemini to provide nuanced outfit suggestions, style recommendations, and detailed fit observations that go beyond simple image recognition.

# What we learned
We learned that image-based API calls are expensive and require careful optimization. We also found that high-quality front-end design and flow takes a significant amount of time to get right.

# What's next for FitCheck
The next steps involve finishing the implementation of image uploads and adding accessibility features like a full voice-to-text flow throughout all stages of the web app. We also plan to integrate a voice chatbot to further narrow down user preferences and style nuances.

# Built With:

gemini-api
lovable
next.js
python
supabase
typescript

# Devpost:
https://devpost.com/software/fitcheck-6rnqz7
