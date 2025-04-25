## Using the AWS CDK with Localstack

from terminal window

### create sample app
```bash
mkdir stack
cd stack
mkdir aws
cd aws
cdklocal init init app --language python
```

### bootstrap localstack environment
```bash
cdklocal synth
cdklocal bootstrap
```

# deploy the sample app
```bash
cdklocal deploy
> Do you wish to deploy these changes (y/n)? y
```

# destroy the structure
```bash
cdklocal destroy
```

All structure are build inside the folder with the python file:

""stack/aws/aws/aws_stack.py"

The lambda for structure should be inside the folder: 

"stack/aws/lambda"
