SkillSwap 2.0 — Peer-to-Peer Skill Barter Platform
Problem Statement: College students want to learn new skills from each other (e.g., Python for Guitar) but lack the funds for formal coaching and a dedicated platform to connect.

Our Solution: A Peer-to-Peer Skill Barter Platform. Students list the skills they possess and the ones they wish to learn. An integrated AI engine matches compatible pairs. Sessions are conducted via in-app WebRTC video calls, driven by a skill-credit economy where teaching earns credits and learning spends them. Quality is maintained through a peer rating system, verified badges, and a thriving community forum.

Local Setup
1. Clone & Install dependencies:

Bash
git clone <repository-url>
cd <repository-directory>
npm install
2. Database Migrations:
Execute the following files in your Supabase SQL Editor to establish the schema:

supabase_schema.sql

supabase/migrations/add_badges_system.sql

supabase/migrations/add_community_forum.sql

supabase/migrations/add_resources_table.sql

3. Start the Development Server:

Bash
npm run dev
Deployment
The application is optimized for deployment on Vercel, utilizing automatic CI/CD pipelines triggered from the main branch. Ensure all environment variables related to Supabase and Groq API are properly configured in your deployment environment prior to building.
