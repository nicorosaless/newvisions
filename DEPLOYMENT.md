# NewVisions Deployment Guide

## Environment Variables

Before deploying, make sure you have the following environment variables set:

### Required
- `MONGO_URI`: MongoDB connection string
- `ELEVEN_LABS_API_KEY`: Your ElevenLabs API key
- `GOOGLE_API_KEY`: Your Google API key

### Optional
- `APP_NAME`: Application name (default: newvisions-backend)
- `ENV`: Environment (default: production)
- `PORT`: Port to run on (default: 5002)
- `ELEVEN_LABS_VOICE_ID`: Default voice ID
- `ELEVEN_LABS_MODEL`: Voice model (default: eleven_turbo_v2_5)

## Deployment Options

### 1. Nixpacks (Railway, Render, etc.)

The project is configured for Nixpacks deployment with:
- `Procfile`: Defines the web process
- `runtime.txt`: Specifies Python 3.11
- `nixpacks.toml`: Custom Nixpacks configuration
- `requirements.txt`: Python dependencies

### 2. Manual Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGO_URI="your_mongodb_uri"
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

### Nixpacks Issues
- Make sure all required environment variables are set
- Check that `requirements.txt` includes all dependencies
- Verify that the `Procfile` points to the correct start command

### Runtime Issues
- Ensure MongoDB is accessible from your deployment environment
- Check that API keys are valid and have proper permissions
- Verify that ffmpeg is available (used for audio processing)

### CORS Issues
- The backend has CORS middleware configured to allow all origins
- For production, consider restricting the allowed origins in `backend/main.py`
