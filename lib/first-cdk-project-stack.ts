import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
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
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "CloudfrontAccess",
      {
        comment: `OriginAccessIdentity for ${mybucket.bucketName}`,
      }
    );
    mybucket.grantRead(originAccessIdentity);
    const cf = new cloudfront.Distribution(this, "myDist", {
      defaultBehavior: { origin: new origins.S3Origin(mybucket) },
    });
    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: mybucket,
      sources: [Source.asset(path.join(__dirname, "..", "dist"))],
    });
  }
}
