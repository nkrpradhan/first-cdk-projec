import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
//this stack is for creating cloudfront with s3
export class FirstCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const mybucket = new s3.Bucket(this, "SimpleBucketFromCDK", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      accessControl: s3.BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    const mybucket2 = new s3.Bucket(this, "SimpleBucketFromCDK2", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      accessControl: s3.BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "CloudfrontAccess",
      {
        comment: `OriginAccessIdentity for ${mybucket.bucketName}`,
      }
    );

    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: mybucket,
      sources: [Source.asset(path.join(__dirname, "..", "dist"))],
    });
    new BucketDeployment(this, "BucketDeployment2", {
      destinationBucket: mybucket2,
      sources: [Source.asset(path.join(__dirname, "..", "dist2"))],
    });

    mybucket.grantRead(originAccessIdentity);
    mybucket2.grantRead(originAccessIdentity);

    //lambda function
    const lambdaFn = new lambda.Function(this, "MyLambdaFunc", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda-handler")),
    });
    const fnUrl = lambdaFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });
    //split the func url as it throws an error
    const splitFunctionUrl = cdk.Fn.select(2, cdk.Fn.split("/", fnUrl.url));
    new cdk.CfnOutput(this, "TheFuncUrl", {
      value: fnUrl.url,
    });
    const bucket2Origin = new origins.S3Origin(mybucket2);
    //cloudfront distribution with multiple origins
    const cf = new cloudfront.Distribution(this, "myDist", {
      defaultBehavior: { origin: new origins.S3Origin(mybucket) },
      additionalBehaviors: {
        "/demo.html": {
          origin: bucket2Origin,
        },
        "/do.jpg": {
          origin: bucket2Origin,
        },
        "/test": {
          origin: new origins.HttpOrigin(splitFunctionUrl),
        },
      },
    });
  }
}
