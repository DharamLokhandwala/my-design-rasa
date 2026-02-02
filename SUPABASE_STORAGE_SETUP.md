# Supabase Storage Bucket Setup

## Step 1: Create the "designs" Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Enter bucket name: `designs`
6. **Important**: Check **"Public bucket"** (this allows public URLs to work)
7. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (RLS)

After creating the bucket, you need to set up policies so authenticated users can upload files:

1. Click on the **"designs"** bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New policy"**

### Policy 1: Allow authenticated users to upload files

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**: 
  ```sql
  (bucket_id = 'designs'::text) AND (auth.role() = 'authenticated'::text)
  ```

### Policy 2: Allow public read access (for public URLs)

- **Policy name**: `Allow public reads`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'designs'::text
  ```

Alternatively, you can use the SQL Editor to run these policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs');

-- Allow public read access
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'designs');
```

## Step 3: Verify

After setup, try uploading an image again. The "Bucket not found" error should be resolved.
