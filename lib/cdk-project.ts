import { randomBytes } from 'crypto';
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  ECSResources,
  VPCResources,
  DistributionResources,
  PipelineResources,
} from './index';

export class CdkProjectStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpcResources = new VPCResources(this, 'vpcResources');

    const ecsResources = new ECSResources(this, 'ecsResources', {
      vpc: vpcResources.vpc,
      fargateAlbSecurityGroup: vpcResources.fargateAlbSecurityGroup,
    });

    const pipeline = new PipelineResources(this, 'pipelineResources', {
      fargateService: ecsResources.fargateService,
    });

    // const distribution = new DistributionResources(
    //   this,
    //   'distributionResources',
    //   {
    //     fargateService: ecsResources.fargateService,
    //     applicationLoadBalancer: ecsResources.applicationLoadBalancer,
    //   },
    // );

    // new CfnOutput(this, 'distributionDomainName', {
    //   value: distribution.distribution.distributionDomainName,
    // });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new CdkProjectStack(app, 'cdk-docker-codebuild-dev', { env: devEnv });

app.synth();