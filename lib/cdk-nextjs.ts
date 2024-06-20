import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { randomBytes } from 'crypto';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import {
//   ECSResources,
//   VPCResources,
//   DistributionResources,
//   PipelineResources,
// } from './index';

import * as path from 'path';
import { RemovalPolicy, SecretValue, aws_ecr, aws_iam as iam } from 'aws-cdk-lib';

export class CdkNextjsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'MyRepository', {
      repositoryName: 'my-repo'
    });

    new codebuild.GitHubSourceCredentials(this, 'CodeBuildGitHubCreds', {
      accessToken: SecretValue.secretsManager('admin-github-token'),
    });
    
    // Create a CodeBuild project to build and push Docker image
    const project = new codebuild.Project(this, 'MyProject', {
      source: codebuild.Source.gitHub({
        owner: 'longtq0711',
        repo: 'nextjsdashboard',
        webhook: false,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws --version',
              'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 448462876398.dkr.ecr.us-east-1.amazonaws.com'
            ]
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t my-repo .',
              'docker tag my-repo:latest 448462876398.dkr.ecr.us-east-1.amazonaws.com/my-repo:latest'
            ]
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              'docker push 448462876398.dkr.ecr.us-east-1.amazonaws.com/my-repo:latest',
              'printf \'[{"name":"container-name","imageUri":"%s"}]\' $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION > imagedefinitions.json'
            ]
          }
        },
        artifacts: {
          files: 'imagedefinitions.json'
        }
      }),
      environmentVariables: {
        'AWS_ACCOUNT_ID': { value: "448462876398" },
        'AWS_DEFAULT_REGION': { value: "us-east-1" },
        'REPOSITORY_URI': { value: repository.repositoryUri },
      },
    });

    // Grant necessary permissions to the CodeBuild project
    repository.grantPullPush(project.role!);

    project.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage', 'ecr:CompleteLayerUpload', 'ecr:UploadLayerPart', 'ecr:InitiateLayerUpload', 'ecr:BatchCheckLayerAvailability'],
      resources: [repository.repositoryArn]
    }));

    // const sourceOutput = new codepipeline.Artifact();
    // const buildOutput = new codepipeline.Artifact();

    // const buildAction = new codepipeline_actions.CodeBuildAction({
    //   actionName: 'Build',
    //   project: project,
    //   input: sourceOutput,
    //   outputs: [buildOutput]
    // })

    // Lambda function using the container image from ECR
    // const lambdaFunction = new lambda.DockerImageFunction(this, 'NextjsLambda', {
    //   code: lambda.DockerImageCode.fromEcr(repository, {
    //     tag: 'latest'
    //   }),
    //   environment: {
    //     NODE_ENV: 'production'
    //   }
    // });



    // Output the repository URI for verification
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'The URI of the ECR repository',
    });
  }
}

function generateRandomString(length: number): string {
  const randomBytesArray = randomBytes(length);
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytesArray[i] % charset.length;
    result += charset.charAt(randomIndex);
  }

  return result;
}