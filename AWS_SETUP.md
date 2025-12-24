# AWS Configuration Guide for RentalRooms

This guide explains how to set up your AWS account to work with the new Storage (S3) and Email (SES) features.

## 1. Get AWS Access Keys
1.  Log in to the **AWS Management Console**.
2.  Search for **IAM** (Identity and Access Management).
3.  Click **Users** > **Create user**.
4.  Name the user (e.g., `rental-app-user`).
5.  Click **Next**.
6.  Select **Attach policies directly**.
7.  Search for and select these two policies:
    *   `AmazonS3FullAccess` (For storage)
    *   `AmazonSESFullAccess` (For emails)
    *   *Note: For production, you should create more restrictive policies, but this is fine for checking things out.*
8.  Click **Next** > **Create user**.
9.  Click on the newly created user name.
10. Click the **Security credentials** tab.
11. Scroll down to **Access keys** and click **Create access key**.
12. Select **Local code** (or "Application running outside AWS").
13. Copy the **Access Key ID** and **Secret Access Key**.
14. Add them to your `.env.local` file:
    ```env
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_REGION=us-east-1  # or your preferred region like ap-south-1
    ```

## 2. Set Import Amazon S3 (Storage)
1.  Search for **S3** in the AWS Console.
2.  Click **Create bucket**.
3.  **Bucket name**: Enter a unique name (e.g., `rental-rooms-storage-yourname`).
4.  **Region**: Choose the same region as in your `.env.local` (e.g., `us-east-1` N. Virginia or `ap-south-1` Mumbai).
5.  **Object Ownership**: Select **ACLs enabled** and **Bucket owner preferred**.
    *   *Why?* This makes it easier to make individual objects public (like profile pics) without complex bucket policies for now.
6.  **Block Public Access settings**: Uncheck **Block all public access**.
    *   Check the warning box "I acknowledge that...".
    *   *Note: Detailed bucket policies are cleaner, but this is the "quick start" method.*
7.  Click **Create bucket**.
8.  Add the bucket name to `.env.local`:
    ```env
    AWS_S3_BUCKET_NAME=rental-rooms-storage-yourname
    ```

## 3. Verify Your Setup
Once you have added your keys to `.env.local`, run this command to check if everything is connected correctly:

```bash
npm run aws:verify
```
If it prints green checkmarks, you are good to go!

