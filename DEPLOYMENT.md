# Deploying Next.js to AWS using Amplify (Recommended)

Since you are using Next.js, the **best and easiest way** to deploy on AWS with full CI/CD (Continuous Integration/Continuous Deployment) is using **AWS Amplify**.

It automatically detects Next.js, handles the build process, manages SSL certificates, and updates the live site every time you push to your Git repository (GitHub, GitLab, etc.).

## Prerequisites
1.  **Push your code to a Git provider** (GitHub, GitLab, or Bitbucket).
2.  Have your **AWS Console** open.

## Step-by-Step Guide

### 1. Connect to AWS Amplify
1.  Search for **Amplify** in the AWS Console search bar.
2.  Click **"Create new app"** (or "Get Started" > "Host your web app").
3.  Choose your repository provider (e.g., **GitHub**).
4.  Authorize AWS Amplify to access your GitHub account.
5.  Select your **Repository** (`RentalRooms`) and the **Branch** (usually `main` or `master`).

### 2. Configure Build Settings
Amplify usually auto-detects that this is a Next.js app.

1.  Look at the **"Build and test settings"**. It should auto-populate a `amplify.yml`.
2.  **IMPORTANT:** You need to add your Environment Variables here so the build server knows them.
3.  Click **"Advanced settings"** > **"Environment variables"**.
4.  Add **ALL** the secrets from your `.env.local` file here:

    | Key | Value (Example/Description) |
    | :--- | :--- |
    | `MONGODB_URI` | `mongodb+srv://...` (Your production DB connection string) |
    | `NEXTAUTH_SECRET` | `your-secret-key` |
    | `NEXTAUTH_URL` | Leave this empty or set to your Amplify URL after deployment |
    | `AWS_ACCESS_KEY_ID` | `...` |
    | `AWS_SECRET_ACCESS_KEY` | `...` |
    | `AWS_REGION` | `ap-southeast-2` |
    | `AWS_S3_BUCKET_NAME` | `rental-rooms-storage-aaditya` |
    | `GOOGLE_CLIENT_ID` | `...` (if using Google Auth) |
    | `GOOGLE_CLIENT_SECRET` | `...` (if using Google Auth) |

    *Note: For `NEXTAUTH_URL`, Amplify usually handles it, but typically you set it to the domain Amplify gives you (e.g. `https://main.d12345.amplifyapp.com`).*

### 3. Deploy
1.  Click **"Next"** and then **"Save and deploy"**.
2.  Amplify will now:
    *   ⬇️ Clone your repo
    *   🏗️ Build your Next.js app (`npm run build`)
    *   🚀 Deploy it to a global CDN
    *   ✅ Verify it

### 4. Automatic Updates (CI/CD)
Now, whenever you make changes:
1.  Edit code on your PC.
2.  `git add .`
3.  `git commit -m "Added new feature"`
4.  `git push origin main`

✨ AWS Amplify will detect the push, automatically rebuild, and update the live website within minutes.

---

## Alternative: Environment Variable Management
If you don't want to type env vars manually in the console:
1.  You can use **AWS Systems Manager Parameter Store** (Advanced).
2.  But for this project, adding them in the Amplify "Environment variables" settings is the standard approach.

## Troubleshooting Common Issues

**Build fails on `npm install`?**
- Make sure your `package.json` and `package-lock.json` are committed to Git.

**Images not loading?**
- Verify `AWS_S3_BUCKET_NAME` and `AWS_REGION` are correct in Amplify Environment Variables.
- Ensure your S3 bucket policy (Global Read Access) is still active.

**Login not working?**
- You might need to update your **Google Cloud Console** (or other OAuth providers) to add the new Amplify Domain (e.g., `https://main...amplifyapp.com`) to the "Authorized redirect URIs".
