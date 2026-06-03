I am building a mock technical interview IDE as a portfolio project. Here is everything you need to know:
What it is:
A browser-based coding interview platform for developers practising technical interviews. Think CoderPad but free, with AI features built in natively.
Core features I want to build:

Monaco Editor (VS Code's editor) embedded in the browser with language selection
Split panel layout — problem description on the left, code editor on the right
Timer (both countdown and count-up modes)
Run code against test cases using the Piston API (free, no setup required)
A hardcoded problem set of ~20-30 LeetCode-style problems stored as JSON
Keystroke playback — records every keystroke during a session so the user can replay their entire thought process afterwards
AI hint system — if the user is stuck for a set amount of time, it offers progressive hints without giving the answer away
AI post-solve review — after submitting, analyses the solution for correctness, time/space complexity, and improvements
User sessions saved with Supabase (free tier)

Tech stack:

React frontend
Monaco Editor (@monaco-editor/react)
Piston API for code execution
Supabase for auth and saving sessions
Claude API (claude-sonnet-4-20250514) for AI features

My experience level:
I am a student developer, comfortable with full-stack JavaScript/React but building this as a portfolio project to talk about in interviews. I want clean, well-structured code I can actually explain.
What I need from you:
Help me build this step by step. Start by giving me the full project structure and folder layout, then we will build each feature one at a time. Ask me questions if anything is unclear before generating code. Point out any technical decisions I should be aware of as we go.
