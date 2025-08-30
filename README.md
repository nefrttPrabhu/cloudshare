# cloudshare
A modern file upload service built with Next.js that allows users to upload files and folders and get the downloadable URLs for sharing.

## Features

- 📁 **File & Folder Upload**: Upload single files or entire folders
- 🎯 **Drag & Drop**: Intuitive drag and drop interface
- 🔗 **Signed URLs**: Generate secure, time-limited download links
- 📊 **Progress Tracking**: Real-time upload progress
- 🌙 **Dark/Light Mode**: Toggle between themes
- 📱 **Responsive Design**: Works on desktop and mobile

## Setup

### Prerequisites

- Node.js 18+ 
- AWS Account with S3 bucket
- AWS IAM user with S3 permissions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cloudshare
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS credentials in `.env`:
```env
AWS_REGION="your-region"
S3_BUCKET="your-s3-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Create an IAM user with the following policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```
3. Generate access keys for the IAM user
4. Update your `.env` file with the credentials

## How It Works

1. **Upload Process**:
   - User selects files or drags them to the upload area
   - Frontend requests a presigned URL from the API
   - File is uploaded directly to S3 using the presigned URL
   - API generates a download URL for sharing

2. **Security**:
   - Files are uploaded directly to S3 (no server storage)
   - Download URLs are signed and expire after 1 hour
   - Unique file names prevent conflicts

## API Endpoints

- `POST /api/aws` - Generate presigned upload URL
- `GET /api/aws?key=<file-key>` - Generate presigned download URL

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Storage**: AWS S3
- **Authentication**: AWS IAM

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

MIT License
>>>>>>> c9fea53 (made the logic for handling files uploads)
