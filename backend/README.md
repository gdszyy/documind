_# DocuMind Backend API Service

This directory contains the source code for the DocuMind Backend API Service, a Node.js application built with Express. It is designed to connect to Neo4j, Qdrant, and Redis databases and is pre-configured for seamless deployment on Railway.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database connection modules (Neo4j, Qdrant, Redis)
│   ├── routes/         # API route handlers (e.g., health check)
│   ├── services/       # Business logic modules
│   └── index.js        # Main application entry point
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore file
├── nixpacks.toml       # Nixpacks build configuration for Railway
├── package.json        # Project dependencies and scripts
├── railway.json        # Railway deployment configuration
└── README.md           # This file
```

## Features

- **Express Server**: A robust and minimalist web framework for Node.js.
- **Database Integration**: Pre-configured modules for connecting to Neo4j, Qdrant, and Redis.
- **Environment-based Configuration**: Uses `dotenv` for local development and seamlessly integrates with Railway's environment variables.
- **Health Check Endpoint**: A `/health` route to monitor the status of the server and its database connections.
- **Graceful Shutdown**: Properly closes database connections on server termination.
- **Railway Ready**: Includes `railway.json` and `nixpacks.toml` for automated, zero-configuration deployments on Railway.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm

### Local Development

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Configure Environment Variables**:

    Copy the `.env.example` file to a new file named `.env` and fill in the connection details for your local databases.

    ```bash
    cp .env.example .env
    ```

3.  **Run the Server**:

    ```bash
    npm run dev
    ```

    The server will start on the port specified in your `.env` file (default is 3000) and will automatically restart on file changes.

## Deployment on Railway

This service is designed for automatic deployment on Railway. The error `Script start.sh not found` occurred because Railway did not find any application code in the repository root.

To fix this, you need to tell Railway to look inside the `backend` directory.

### Configuration Steps

1.  **Go to your Railway project** and select the backend API service.
2.  Navigate to the **Settings** tab.
3.  In the **Source** section, set the **Root Directory** to `./backend`.
4.  Railway will automatically detect the `package.json` and `nixpacks.toml` files and know how to build and start the application using the `npm start` command.

Once you push these new files to your GitHub repository, Railway will trigger a new deployment using this configuration.

## API Endpoints

### Health Check

- **Endpoint**: `GET /health`
- **Description**: Checks the connection status of all integrated database services (Neo4j, Qdrant, Redis) and returns a consolidated health report.
- **Success Response (200 OK)**:

  ```json
  {
    "status": "healthy",
    "timestamp": "2025-12-10T12:00:00.000Z",
    "services": {
      "neo4j": "connected",
      "qdrant": "connected",
      "redis": "connected"
    }
  }
  ```

- **Error Response (503 Service Unavailable)**:

  ```json
  {
    "status": "degraded",
    "timestamp": "2025-12-10T12:00:00.000Z",
    "services": {
      "neo4j": "disconnected",
      "qdrant": "connected",
      "redis": "connected"
    }
  }
  ```

---

**Written by Manus AI**
_

### Entity Management

- **Endpoint**: `GET /api/entities`
- **Description**: Retrieves a list of all entities, sorted by last updated time.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "...",
      "name": "User Service",
      "type": "Service",
      "lark_doc_url": "https://fake-feishu.cn/docs/..."
    }
  ]
  ```

- **Endpoint**: `POST /api/entities`
- **Description**: Creates a new entity and a corresponding (mock) Lark document.
- **Request Body**:
  ```json
  {
    "name": "Login API",
    "type": "API",
    "owner": "John Doe",
    "description": "Handles user authentication.",
    "status": "Development"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": "...",
    "name": "Login API",
    "type": "API",
    "lark_doc_url": "https://fake-feishu.cn/docs/..."
  }
  ```

- **Endpoint**: `GET /api/entities/:id`
- **Description**: Retrieves a single entity by its ID.

- **Endpoint**: `PUT /api/entities/:id`
- **Description**: Updates an existing entity.

- **Endpoint**: `DELETE /api/entities/:id`
- **Description**: Deletes an entity.

### Knowledge Graph

- **Endpoint**: `GET /api/graph`
- **Description**: Retrieves the data needed to render the knowledge graph.
- **Success Response (200 OK)**:
  ```json
  {
    "nodes": [
      { "id": "...", "label": "User Service" }
    ],
    "edges": [
      { "source": "...", "target": "...", "label": "EXPOSES_API" }
    ]
  }
  ```
