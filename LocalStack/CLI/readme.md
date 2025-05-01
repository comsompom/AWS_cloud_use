## Use the CLI to deploy for Localstack

start the python script

```commandline
python deploy_python_lambda.py
```

all settings should be done in the constants:

```python
END_POINT = "--endpoint-url=http://localhost:4566"
FUNCTION_NAME = "lambda_sample"
S3_BUCKET_NAME = "lambda-dynamo-s3"
```

lambda should be zipped first

in the code bellow should be changed the "--runtime" and lambda "--function-name"

```python
result = subprocess.run(["aws", "lambda", "create-function", 
                         "--function-name", FUNCTION_NAME, 
                         "--runtime", "python3.12", 
                         "--zip-file", f"fileb://{FUNCTION_NAME}.zip", 
                         "--handler", f"{FUNCTION_NAME}.handler", 
                         "--role", arn_role, END_POINT], shell=True,
                        stdout=subprocess.PIPE,
                        universal_newlines=True)
```
