Personal Finance App
A full-stack personal finance web app that helps users track income and expenses, visualize spending, set savings goals, and get AI-powered recommendations to improve their budget.
Built with React + Firebase, with the core logic migrated from an earlier Python script I wrote for my own finances.
<img width="1920" height="700" alt="Dashboard" src="https://github.com/user-attachments/assets/535b4f6c-463b-4ab0-ba0c-d498d3e531df" />
<img width="1920" height="700" alt="Transactions" src="https://github.com/user-attachments/assets/819d5cce-9402-4a44-8836-1c018e0671c0" />
<img width="1920" height="700" alt="AI recommendations" src="https://github.com/user-attachments/assets/2f598b9c-c237-4074-84e4-10583b0e1729" />
**Live demo:** https://app-financias-50396.web.app/
**Demo account:** Demo account: demo@demo.com / demo1234
Features
Authentication: email/password sign-up and login with Firebase Auth
Dashboard: balance cards and interactive charts (Recharts) showing where the money goes
Transactions: add, edit, and categorize income and expenses
Onboarding wizard: guides new users through their first setup
AI recommendations: spending diagnostics, a budget-cut simulator, and analysis powered by an LLM API (Anthropic Claude)
Savings goals: track progress toward financial goals (in progress)
Dark mode: theme handled with CSS custom properties
Tech stack
Layer	Technology
Frontend	React, Vite, JavaScript, CSS
Charts	Recharts
Auth & database	Firebase Authentication, Cloud Firestore
AI	Anthropic API
Tooling	ESLint, Git
Data model
Each user's data is isolated under their own document in Firestore:
```
usuarios/{uid}/transacoes   # transactions
usuarios/{uid}/metas        # savings goals
```
Firestore security rules (`firestore.rules`) ensure users can only read and write their own data.
Getting started
```bash
# 1. Clone the repository
git clone https://github.com/GuilhermeNascimento-bit/personal-finance-app.git
cd personal-finance-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in your Firebase project config (and API key for AI features)

# 4. Run locally
npm run dev
```
What I learned
Structuring a React app with authentication and per-user data in a NoSQL database
Writing Firestore security rules to protect user data
Migrating logic from a Python script into a JavaScript web app
Integrating an LLM API to turn raw financial data into practical suggestions
Roadmap
[ ] Finish the savings goals tab
[ ] Move AI calls to a backend function so the API key is never exposed to the browser
[ ] Export reports to CSV/PDF
Author
Guilherme do Nascimento Bezerra · LinkedIn · GitHub
