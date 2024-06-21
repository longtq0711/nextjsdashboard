import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { randomBytes } from 'crypto';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as loadbalance from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { LoadBalancerV2Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

// import {
//   ECSResources,
//   VPCResources,
//   DistributionResources,
//   PipelineResources,
// } from './index';

import * as path from 'path';
import { RemovalPolicy, SecretValue, aws_s3, aws_iam as iam } from 'aws-cdk-lib';

export class CdkNextjsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'MyRepository', {
      repositoryName: 'my-repo',
      removalPolicy: RemovalPolicy.DESTROY
    });

    new codebuild.GitHubSourceCredentials(this, 'CodeBuildGitHubCreds', {
      accessToken: SecretValue.secretsManager('admin-github-token'),
    });
    
    const project = new codebuild.Project(this, 'MyProject', {
      source: codebuild.Source.gitHub({
        owner: 'longtq0711',
        repo: 'nextjsdashboard',
        webhook: true,
        webhookTriggersBatchBuild: true, 
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs("main"),
          codebuild.FilterGroup.inEventOf(codebuild.EventAction.PULL_REQUEST_MERGED).andBranchIs("main")
        ]
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

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput]
    })

    // new codepipeline.Pipeline(this, 'Pipeline', {
    //   pipelineName: 'MyLambdaPipeline',
    //   stages: [
    //     {
    //       stageName: 'Build',
    //       actions: [buildAction],
    //     },
    //   ],
    // });

    //Lambda function using the container image from ECR
    // const lambdaFunction = new lambda.DockerImageFunction(this, 'NextjsDashboard', {
    //   code: lambda.DockerImageCode.fromEcr(repository, {
    //     tagOrDigest: 'latest'
    //   }),
    //   timeout: cdk.Duration.seconds(150),
    //   environment: {
    //     PORT: '3000',
    //   },
    // });

    // const vpc = new ec2.Vpc(this, 'MyVpc', {
    //   maxAzs: 2,
    // });

    // // ALB
    // const lb = new loadbalance.ApplicationLoadBalancer(this, 'LB', {
    //   vpc,
    //   internetFacing: true,
    // });

    // const listener = lb.addListener('Listener', {
    //   port: 80,
    //   open: true,
    // });

    // const targetGroup = new loadbalance.ApplicationTargetGroup(this, 'TargetGroup', {
    //   targetType: loadbalance.TargetType.LAMBDA,
    //   targets: [new elbv2_targets.LambdaTarget(lambdaFunction)],
    //   healthCheck: {
    //     enabled: true,
    //     interval: cdk.Duration.seconds(30), // Adjust as necessary
    //     path: '/', // Ensure this path returns a healthy response
    //     timeout: cdk.Duration.seconds(5),
    //   },
    // });

    // listener.addTargetGroups('TargetGroup', {
    //   targetGroups: [targetGroup],
    // });
    // // const applicationLoadBalancerListener = lb.addListener(
    // //   'applicationLoadBalancerListener',
    // //   {
    // //     port: 80,
    // //     protocol: loadbalance.ApplicationProtocol.HTTP,
    // //     open: true,
    // //     defaultTargetGroups: [targetGroup],
    // //   },
    // // );

    // const lambdaPolicy = new iam.PolicyStatement({
    //   actions: ['lambda:InvokeFunction'],
    //   resources: [lambdaFunction.functionArn],
    //   principals: [new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com')],
    // });

    // lambdaFunction.addPermission('AlbInvokePermission', {
    //   principal: new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
    //   sourceArn: targetGroup.targetGroupArn,
    // });

    // const distribution = new cloudfront.Distribution(this, 'myDist', {
    //   defaultBehavior: {
    //     origin: new LoadBalancerV2Origin(lb, {
    //       protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    //       originId: 'default-origin',
    //     }),
    //   },
    // });

    // Output the repository URI for verification
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'The URI of the ECR repository',
    });

    // new cdk.CfnOutput(this, 'CloudFrontURL', {
    //   value: distribution.domainName,
    // });
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