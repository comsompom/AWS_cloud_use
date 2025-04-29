# create sample app
```batch
mkdir js_stack
cd js_stack
cdklocal init app --language=typescript
```
after cdklocal will create the poject go to the folder: "bin" and replace the "js_stack.ts" file with 
# bootstrap localstack environment
cdklocal bootstrap

# deploy the sample app
cdklocal deploy
> Do you wish to deploy these changes (y/n)? y
