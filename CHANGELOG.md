# Changelog

All notable changes to this project will be documented in this file.

## 2022-07-23

### Updates

- Now utilizes `npm ci` to install node modules
- Deleted the cache-data, tools, and endpoint files as these are now available through npm (Yay!)
- Updated README to reflect changes, and made another pass through making sure tutorials are clear and up to date

## 2023-05-16

### Update

- Added DynamoDb Auto Scaling Policy

5 Read or Write units should be enough for small to medium sized projects, but if you look at your DynamoDb dashboard and see your reads and writes coming close to what you have provisioned, you will want to enable autoscaling.

### Apply update to existing installs

If you have already installed this application you will need to make a change to your application's CloudFormation template.yml file.

Copy `UserTableWriteCapacityScalableTarget` and `UserTableWriteScalingPolicy` from the most recent template in the repository and include it in your own template. Make sure the YAML indents are properly formatted.

## [Unreleased]
### Updates
### Fixes