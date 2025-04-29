# create sample app
```batch
mkdir js_stack
cd js_stack
cdklocal init app --language=typescript
```
after cdklocal will create the poject go to the folder: "bin" and replace the "js_stack.ts" file with this repo file:
https://github.com/comsompom/AWS_cloud_use/blob/main/LocalStack/CDK_TS/js_stack-stack.ts

then inside this js_stack folder copy two lambdas with their folders: "api_lambda" and "sqs_lambda"

in the folder js_stack in the terminal run commands:
```batch
npm run build
cdklocal synth
cdklocal bootstrap
cdklocal deploy
> Do you wish to deploy these changes (y/n)? y
```

