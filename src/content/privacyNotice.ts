import { SITE } from '../config/site';

/**
 * Privacy notice rendered at `/privacy` via the shared <Markdown> component.
 * Identity values come from `SITE` so they stay in sync with the rest of the app.
 * Update the "Last updated" date below whenever the substance changes.
 */
export const PRIVACY_NOTICE = `_Last updated: 11 June 2026_

This notice explains what personal data **${SITE.name}** ("we", "I") collects when you
use **${SITE.domain}** (the "Service"), why, and your rights under UK GDPR and the Data
Protection Act 2018.

**Controller:** ${SITE.author} - contact: **${SITE.email}**.

## 1. What we collect

We only collect what the Service needs to work. You provide some of it; some is generated
as you practise.

| Data | What it is | Source |
|------|-----------|--------|
| **Email address** | Used to create and sign in to your account | You, at sign-up |
| **Password** | Stored only as a salted hash by our auth provider - we never see it | You, at sign-up |
| **Practice sessions** | The code you write, the problem attempted, language, status, time spent, and keystroke timing data for each attempt | Generated as you practise |
| **AI review feedback** | Automated feedback generated about your submitted code (if you use the AI feature) | Generated on request |
| **Custom problems** | Any practice problems you create and save | You |

We do **not** collect: name, address, payment details, location, or marketing/tracking
cookies. We do not use advertising or third-party analytics trackers.

> **Note on keystroke data:** to replay and analyse a practice attempt, the Service records
> the timing of your keystrokes **within the code editor only**. It is not keylogging
> outside the editor and is never used to identify you beyond your own account.

> **Note on sharing:** your sessions are private by default. If you choose to **Share** a
> session, anyone with its link can view that attempt's code and keystroke replay (but not
> your account details) until you **Unshare** it. Sharing is entirely optional and off
> unless you turn it on.

## 2. Why we use it (lawful basis)

- **To provide the Service** (create your account, save and show your sessions and custom
  problems, run your code, generate AI review) - lawful basis: **performance of a contract**
  / **legitimate interests** in operating the Service you asked to use.
- We do **not** use your data for marketing and do **not** sell or share it for advertising.

## 3. Who processes it (our processors)

Your data is stored and processed on our behalf by:

- **Supabase** - database, authentication, and storage hosting (EU region).
- **Amazon Web Services (AWS)** - runs the sandbox that executes your submitted code
  (London, eu-west-2). Code is run transiently and not retained by the execution sandbox.
- **Vercel** - serves the website frontend.
- **Groq** - if you use the AI hint/review feature, your submitted code is sent to Groq's
  API (running the Llama 3.3 70B model) to generate feedback. Groq processes this in the
  United States. This involves a transfer of your data outside the UK; it is protected by
  the UK International Data Transfer Addendum to the EU Standard Contractual Clauses under
  our agreement with Groq.

Each acts as a **processor** under our instructions. We do not transfer your data to anyone
else.

## 4. How long we keep it

- **Account data, sessions, and custom problems:** kept until you delete them or delete your
  account, after which they are removed.
- Deleting your account cascades to delete your sessions and custom problems.

## 5. Your rights

Under UK GDPR you have the right to: access your data, correct it, delete it ("right to
erasure"), restrict or object to processing, and data portability. You can exercise most of
these yourself in-app (edit and delete sessions and problems, delete your account), or email
**${SITE.email}** and we will respond within one month.

You also have the right to complain to the UK regulator, the Information Commissioner's
Office (ICO): https://ico.org.uk/make-a-complaint/.

## 6. Security

Access to your data is restricted to your own account through database row-level security,
passwords are stored only as salted hashes, and all traffic is served over HTTPS.

## 7. Children's privacy

The Service is intended for adults and older students preparing for technical interviews. It
is **not directed at children under 16**, and we do not knowingly collect personal data from
them. If you believe a child under 16 has created an account or provided us with their data,
please email **${SITE.email}** and we will delete it.

## 8. Changes

We may update this notice; the "Last updated" date above will change. Material changes will
be highlighted in-app.
`;
