
# Pulumi AWS ECS Fargate and RDS Project

This Pulumi project deploys an ECS Fargate service with an Application Load Balancer and an RDS PostgreSQL instance on AWS.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [Node.js](https://nodejs.org/)
- [AWS CLI](https://aws.amazon.com/cli/)

## Setup

1. Install Pulumi:
```shell
curl -fsSL https://get.pulumi.com | sh
```

2. Configure AWS credentials:
```shell
aws configure
```

3. Clone this repository and navigate to the project directory.

4. Install dependencies:
```shell
npm install
```

## Configuration

You can configure the project using Pulumi config. Here are the available options:

- `containerPort`: The port the container listens on (default: 80)
- `cpu`: CPU units for the Fargate task (default: 512)
- `memory`: Memory (in MB) for the Fargate task (default: 128)
- `imageLink`: Docker image to use (default: public.ecr.aws/nginx/nginx:1-alpine3.19). You need to replace that with Mursion Project URL

To set a config value:

```shell
pulumi config set containerPort 8080
```

## Deployment

To deploy the project:

```shell
pulumi up
```

Review the changes and confirm to deploy.

## Outputs

After deployment, Pulumi will output:

- `url`: The URL of the Application Load Balancer
- `dbEndpoint`: The endpoint of the RDS instance
- `dbPort`: The port of the RDS instance
- `dbName`: The name of the database
- `dbUsername`: The username for the database
- `dbPasswordLog`: The password for the database (Note: Be cautious with this in production environments)

## Cleanup

To destroy the resources:

```shell
pulumi destroy
```

## Notes

- This project creates resources in AWS that may incur costs.
- The RDS instance allows access from anywhere (0.0.0.0/0). In a production environment, you should restrict this to your application's security group.
