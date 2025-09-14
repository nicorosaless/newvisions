# NewVisions Deployment Guide

## Environment Variables

Before deploying, make sure you have the following environment variables set:

### Required
- `MONGO_URI`: MongoDB connection string (see MongoDB setup below)
- `ELEVEN_LABS_API_KEY`: Your ElevenLabs API key
- `GOOGLE_API_KEY`: Your Google API key

### Optional
- `APP_NAME`: Application name (default: newvisions-backend)
- `ENV`: Environment (default: production)
- `PORT`: Port to run on (default: 5002)
- `ELEVEN_LABS_VOICE_ID`: Default voice ID
- `ELEVEN_LABS_MODEL`: Voice model (default: eleven_turbo_v2_5)

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Set `MONGO_URI` in Railway: `mongodb+srv://username:password@cluster.mongodb.net/newvisions?retryWrites=true&w=majority`

### Option 2: Railway MongoDB Plugin
1. In your Railway project, add the MongoDB plugin
2. Railway will automatically set the `MONGO_URI` environment variable
3. No additional configuration needed

### Option 3: Local MongoDB (Development Only)
- Set `MONGO_URI=mongodb://localhost:27017`
- Make sure MongoDB is running locally

## Deployment Options

### 1. Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Railway will automatically detect Nixpacks configuration
3. Set environment variables in Railway dashboard:
   - `MONGO_URI` (from MongoDB setup above)
   - `ELEVEN_LABS_API_KEY`
   - `GOOGLE_API_KEY`
4. Deploy!

### 2. Manual Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGO_URI="your_mongodb_connection_string"
export ELEVEN_LABS_API_KEY="your_api_key"
export GOOGLE_API_KEY="your_google_key"

# Run the application
uvicorn backend.main:get_app --factory --host 0.0.0.0 --port 5002
```

### 3. Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5002

CMD ["uvicorn", "backend.main:get_app", "--factory", "--host", "0.0.0.0", "--port", "5002"]
```

## Frontend Deployment

The frontend is a Vite application. To build for production:

```bash
cd frontend
npm install
npm run build
```

The built files will be in `frontend/dist/` and can be served by any static file server.

## Troubleshooting

### Database Connection Issues
- Make sure `MONGO_URI` is set correctly
- For MongoDB Atlas, ensure IP whitelist includes `0.0.0.0/0` or Railway's IP
- Test connection with: `mongosh "your_connection_string"`

### API Key Issues
- Verify ElevenLabs and Google API keys are valid
- Check API key permissions and quotas

### Build Issues
- Ensure all dependencies are in `requirements.txt`
- Check that Node.js and npm are available for frontend build

### CORS Issues
- The backend has CORS middleware configured to allow all origins
- For production, consider restricting the allowed origins in `backend/main.py`
