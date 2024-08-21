import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as random from "@pulumi/random";

const config = new pulumi.Config();
const containerPort = config.getNumber("containerPort") || 80;
const cpu = config.getNumber("cpu") || 512;
const memory = config.getNumber("memory") || 128;
const imageLink = config.get<string>("imageLink") || "public.ecr.aws/nginx/nginx:1-alpine3.19";

// An ECS cluster to deploy into
const cluster = new aws.ecs.Cluster("cluster", {});

// An ALB to serve the container endpoint to the internet
const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {});

// An ECR repository to store our application's container image
const repo = new awsx.ecr.Repository("repo", {
    forceDelete: true,
});

// Create a VPC for the RDS instance
const vpc = new awsx.ec2.Vpc("my-vpc", {
    numberOfAvailabilityZones: 2,
});

// Create a security group for the RDS instance
const dbSecurityGroup = new aws.ec2.SecurityGroup("db-security-group", {
    vpcId: vpc.vpcId,
    ingress: [{
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["0.0.0.0/0"], // Note: This allows access from anywhere. In production, restrict this to your application's security group.
    }],
});

// Create a subnet group for the RDS instance
const dbSubnetGroup = new aws.rds.SubnetGroup("db-subnet-group", {
    subnetIds: vpc.privateSubnetIds,
});

// Generate a random password for the database
const dbPassword = new random.RandomPassword("db-password", {
    length: 16,
    special: false,
});

// Create an RDS instance (PostgreSQL, free tier)
const db = new aws.rds.Instance("my-db", {
    engine: "postgres",
    engineVersion: "16.3",
    instanceClass: "db.t3.micro",
    allocatedStorage: 20,
    storageType: "gp2",
    dbName: "mursion_it_resources",
    username: "dbuser",
    password: dbPassword.result,
    skipFinalSnapshot: true,
    vpcSecurityGroupIds: [dbSecurityGroup.id],
    dbSubnetGroupName: dbSubnetGroup.name,
});

// Deploy an ECS Service on Fargate to host the application container
const service = new awsx.ecs.FargateService("service", {
    cluster: cluster.arn,
    assignPublicIp: true,
    taskDefinitionArgs: {
        container: {
            name: "app",
            image: imageLink,
            cpu: cpu,
            memory: memory,
            essential: true,
            portMappings: [{
                containerPort: containerPort,
                targetGroup: loadbalancer.defaultTargetGroup,
            }],
            environment: [
                {name: "DB_HOST", value: db.endpoint},
                {name: "DB_PORT", value: pulumi.interpolate`${db.port}`},
                {name: "DB_NAME", value: db.dbName},
                {name: "JDBC_URL" , value: pulumi.interpolate`jdbc:postgresql://${db.endpoint}/${db.dbName}`},
                {name: "DB_USERNAME", value: db.username},
                {name: "DB_PASSWORD", value: dbPassword.result},
            ],
        },
    },
});

// The URL at which the container's HTTP endpoint will be available
export const url = pulumi.interpolate`http://${loadbalancer.loadBalancer.dnsName}`;

// Export the database connection details
export const dbEndpoint = db.endpoint;
export const dbPort = db.port;
export const dbName = db.dbName;
export const dbUsername = db.username;
export const dbPasswordLog = pulumi.interpolate`${dbPassword.result}`;