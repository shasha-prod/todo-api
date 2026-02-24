# Todo API — DevOps Portfolio Project

A containerized REST API deployed to AWS with a fully automated CI/CD pipeline. This project demonstrates end-to-end DevOps practices: infrastructure as code, containerization, automated testing, and continuous deployment.

## Architecture

```
Developer pushes code
        │
        ▼
   GitHub Actions
   ┌─────────────────────┐
   │  1. Run test suite  │
   │  2. Build Docker    │
   │     image           │
   │  3. Push to ECR     │
   │  4. SSH into EC2    │
   │  5. Pull & run      │
   │     new container   │
   └──────────┬──────────┘
              │
              ▼
   AWS Infrastructure (Terraform)
   ┌──────────────────────────────────┐
   │  VPC (10.0.0.0/16)              │
   │                                  │
   │  ┌──────────────────────┐       │
   │  │ Public Subnet        │       │
   │  │ ┌──────────────────┐ │       │
   │  │ │ EC2 (t3.micro)   │ │       │
   │  │ │ Docker → App     │ │       │
   │  │ │ Port 3000        │ │       │
   │  │ └────────┬─────────┘ │       │
   │  └──────────┼───────────┘       │
   │             │ Port 5432          │
   │  ┌──────────┼───────────┐       │
   │  │ Private Subnets      │       │
   │  │ ┌────────▼─────────┐ │       │
   │  │ │ RDS PostgreSQL   │ │       │
   │  │ │ (db.t3.micro)    │ │       │
   │  │ └──────────────────┘ │       │
   │  └──────────────────────┘       │
   └──────────────────────────────────┘
```

## What This Project Demonstrates

- **Containerization** — Application packaged with Docker, orchestrated locally with Docker Compose
- **Infrastructure as Code** — All AWS resources defined and managed with Terraform
- **CI/CD Pipeline** — Automated testing and deployment via GitHub Actions on every push
- **Cloud Networking** — VPC with public/private subnet architecture, security groups restricting database access to the API server only
- **Database Management** — PostgreSQL on RDS in private subnets with SSL encryption, connection pooling, and auto-initialization
- **Security Practices** — IAM roles for EC2, no hardcoded secrets, SSH key authentication, principle of least privilege

## Tech Stack

| Tool | Purpose | Why |
|------|---------|-----|
| Node.js + Express | REST API | Lightweight, widely used for microservices |
| PostgreSQL | Database | Industry standard relational database |
| Docker | Containerization | Consistent environments from dev to production |
| AWS (EC2, RDS, ECR, VPC) | Cloud Infrastructure | Dominant cloud provider, most in-demand |
| Terraform | Infrastructure as Code | Cloud-agnostic, declarative, most requested IaC tool |
| GitHub Actions | CI/CD | Free for public repos, integrated with GitHub |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/todos` | List all todos |
| GET | `/api/todos/:id` | Get a single todo |
| POST | `/api/todos` | Create a todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |

<img width="628" height="621" alt="image" src="https://github.com/user-attachments/assets/6e29689b-b342-47e2-b68b-b9c1368c5e9d" />

<img width="1073" height="140" alt="image" src="https://github.com/user-attachments/assets/07fad622-b8ae-48a8-a5dc-03f7ce13d8c5" />

<img width="672" height="178" alt="image" src="https://github.com/user-attachments/assets/496b6fe8-2c50-4150-a532-52382c20d321" />

## Run Locally

Prerequisites: Docker and Docker Compose installed.

```bash
git clone https://github.com/shasha-prod/todo-api.git
cd todo-api
docker compose up --build
```

The API is available at `http://localhost:3000`. That's it — no Node.js installation, no database setup, no configuration needed.

```bash
# Test it
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World"}'
curl http://localhost:3000/api/todos
```

Tear down:

```bash
docker compose down
```

## Run Tests

```bash
npm install
npm test
```

Tests cover all CRUD operations, error handling, and the health check endpoint. The CI/CD pipeline runs these automatically on every push — if tests fail, the code does not deploy.

## Deploy to AWS

### Prerequisites

- AWS account with CLI configured
- Terraform installed
- S3 bucket for Terraform state

### Provision Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This creates: VPC with public/private subnets, EC2 instance with Docker, RDS PostgreSQL database, ECR container registry, security groups, IAM roles, internet gateway, and route tables.

### Tear Down

```bash
terraform destroy
```

**Always destroy infrastructure when not actively using it to avoid charges.**

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:

1. **Test** — Spins up a PostgreSQL service container, installs dependencies, runs the full test suite
2. **Build** — Builds a Docker image and pushes it to AWS ECR tagged with the commit SHA
3. **Deploy** — SSHs into the EC2 instance, pulls the new image, and restarts the container

Pull requests only run the test stage — no deployment.

Required GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `EC2_HOST` | EC2 instance public IP |
| `EC2_SSH_KEY` | Private key for SSH access |
| `RDS_ENDPOINT` | RDS database hostname |

## Project Structure

```
todo-api/
├── .github/workflows/
│   └── deploy.yml          # CI/CD pipeline
├── src/
│   ├── index.js            # Express app entry point + health check
│   ├── db.js               # PostgreSQL connection pool + auto-init
│   └── routes.js           # CRUD API routes
├── terraform/
│   ├── provider.tf         # AWS provider + S3 backend config
│   ├── variables.tf        # Project name, DB credentials
│   ├── network.tf          # VPC, subnets, internet gateway, routing
│   ├── security.tf         # Security groups (API + DB firewall rules)
│   ├── ecr.tf              # Container registry
│   ├── compute.tf          # EC2 instance + RDS database + IAM roles
│   └── outputs.tf          # EC2 IP, RDS endpoint, ECR URL
├── tests/
│   └── todos.test.js       # API test suite (8 tests)
├── Dockerfile              # Multi-stage Node.js container
├── docker-compose.yml      # Local dev environment (API + PostgreSQL)
├── init.sql                # Database table schema
├── .dockerignore
├── .gitignore
├── package.json
└── README.md
```

## Key Design Decisions

**App auto-creates its database table on startup.** Instead of relying on external migration scripts or manual setup, the app runs `CREATE TABLE IF NOT EXISTS` when it connects to the database. This means any new environment works immediately without manual intervention.

**SSL is conditional based on environment.** The database connection uses SSL when connecting to RDS but not for localhost. This avoids configuration headaches in development while maintaining encryption in production.

**EC2 with Docker instead of ECS/Fargate.** For a single-container application, a simple EC2 instance with Docker is easier to understand, debug, and cheaper than managed container services. The deployment script SSHs in and runs `docker pull` + `docker run` — straightforward and transparent.

**Database in private subnets with security group restriction.** The RDS instance has no public IP and only accepts connections from the API server's security group. Even if someone gained access to the VPC, they couldn't reach the database without being on the API server.

## Screenshots

RDS database
<img width="1905" height="951" alt="image" src="https://github.com/user-attachments/assets/a2f69285-ce1a-4316-820e-1bde2b4dc84b" />

EC2 instance
<img width="1906" height="943" alt="image" src="https://github.com/user-attachments/assets/ec754d2a-1123-4ecc-a9d8-dfd2fc93d8c6" />

ECR repository
<img width="1928" height="707" alt="image" src="https://github.com/user-attachments/assets/b620a861-80ff-4d6c-a61f-3cbce8d1409d" />

GitLab CICD workflows:
<img width="1900" height="811" alt="image" src="https://github.com/user-attachments/assets/5bff614f-71b8-471d-ab33-d05882140847" />

## Lessons Learned

- **Environment parity matters.** Developing in WSL/Ubuntu prevented shell compatibility issues that would have surfaced later in CI/CD and production (both Linux environments).
- **Debugging CI/CD is iterative.** The pipeline didn't work on the first try — credential mismatches, SSL requirements, missing database tables all required fixes. Each failure taught something about the deployment process.
- **Infrastructure as Code pays off immediately.** Being able to `terraform destroy` and `terraform apply` to get a clean environment in minutes made debugging faster and kept AWS costs at zero.
- **Separate configuration from code.** Using environment variables for everything (database credentials, host, port) meant the same Docker image runs locally and on AWS without changes.
