# Deadlock Detection API

REST API backend for the Deadlock Detection System.

## Setup

```bash
cd api
npm install
```

## Running

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3001` by default. Set the `PORT` environment variable to change it.

## Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "deadlock-detection-api"
}
```

## CORS

Configured to allow requests from the frontend dev server at `http://localhost:5173`.
