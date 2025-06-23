# Image Upload Setup Guide

## Option 1: ImgBB API (Recommended)

### Step 1: Get ImgBB API Key
1. Go to [imgbb.com](https://imgbb.com)
2. Create a free account
3. Go to your account settings
4. Find your API key
5. Copy the API key

### Step 2: Update the API Key
1. Open `src/utils/imageUpload.ts`
2. Replace `YOUR_IMGBB_API_KEY` with your actual API key:
   ```typescript
   const IMGBB_API_KEY = 'your_actual_api_key_here';
   ```

### Step 3: Test the Upload
- The app will automatically try ImgBB first
- If ImgBB fails, it will fallback to base64 encoding
- You'll see success/error messages in the UI

## Option 2: Base64 Encoding (No Setup Required)

If you don't want to use ImgBB, the app will automatically use base64 encoding:
- Images are stored as base64 strings in your database
- No external API required
- Works immediately without any setup
- Note: This increases database size

## Features Added

✅ **Team Registration with Logo Upload**
- Upload logo when creating a team
- Image preview before upload
- File validation (type and size)

✅ **Team Logo Management**
- Update team logo anytime
- Camera icon overlay on avatar
- Real-time preview
- Success/error notifications

✅ **File Validation**
- Only image files allowed
- Max file size: 5MB
- Automatic error handling

## Usage

1. **Creating a Team:**
   - Fill in team name
   - Click "Upload Logo" to select an image
   - Preview will show immediately
   - Click "Register Team"

2. **Updating Team Logo:**
   - Click the camera icon on your team avatar
   - Select a new image
   - Click "Update Logo" button
   - Logo will be updated instantly

## Troubleshooting

- **"API key not found"**: Make sure you've updated the API key in `imageUpload.ts`
- **"File too large"**: Reduce image size (max 5MB)
- **"Invalid file type"**: Only image files (jpg, png, gif, etc.) are allowed
- **Upload fails**: The app will automatically fallback to base64 encoding 