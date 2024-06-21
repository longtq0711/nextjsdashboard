import { RemovalPolicy, Stack, SecretValue } from 'aws-cdk-lib';
import {
  Project,
  BuildSpec,
  Source,
  LinuxBuildImage,
} from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CodeBuildAction,
  EcsDeployAction,
  S3SourceAction,
  S3Trigger,
  GitHubSourceAction
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

interface PipelineResourcesProps {
  fargateService: FargateService;
}
export class PipelineResources extends Construct {

  constructor(scope: Construct, id: string, props: PipelineResourcesProps) {
    super(scope, id);

    const repository = new Repository(this, 'MyRepository', {
      repositoryName: 'my-repo',
      removalPolicy: RemovalPolicy.DESTROY
    });

    const project = new Project(this, 'MyProject', {
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      buildSpec: BuildSpec.fromObject({
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

    // Define source action
    const sourceOutput = new Artifact();
    const sourceAction = new GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'longtq0711',
      repo: 'nextjsdashboard',
      branch: 'main',
      oauthToken: SecretValue.secretsManager('admin-github-token'),
      output: sourceOutput,
    });

    // Define build action
    const buildOutput = new Artifact();
    const buildAction = new CodeBuildAction({
      actionName: 'CodeBuild',
      project,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // Define deploy action
    const deployAction = new EcsDeployAction({
      actionName: 'DeployToLambda',
      service: props.fargateService,
      input: buildOutput,
    });

    // Create pipeline
    new Pipeline(this, 'Pipeline', {
      pipelineName: 'MyLambdaPipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy',
          actions: [deployAction],
        },
      ],
    });

  }
}