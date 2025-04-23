import subprocess


END_POINT = "--endpoint-url=http://localhost:4566"
FUNCTION_NAME = "lambda_sample"
S3_BUCKET_NAME = "lambda-dynamo-s3"

result = subprocess.run(["aws", "s3", "mb", f"s3://{S3_BUCKET_NAME}", 
                         END_POINT], shell=True)
print(f"S3 Bucket Creation: {result.returncode}, responce: {result.stdout}")

result = subprocess.run(["aws", "s3", "ls", END_POINT], 
                        shell=True)
print(result.returncode)
print(result.stdout)

result = subprocess.run(["aws", "iam", "create-role", 
                         "--role-name", "lambda-ex", 
                         "--assume-role-policy-document", "file://trust-policy.json", 
                         END_POINT], shell=True,
                        stdout=subprocess.PIPE,
                        universal_newlines=True)
print(result.returncode)
arn_role_ret = [x for x in str(result.stdout).split() if "arn:aws:iam::" in x]
arn_role = arn_role_ret[0].replace('"', "").replace(",", "") if arn_role_ret else ""
print(arn_role)

result = subprocess.run(["aws", "lambda", "create-function", 
                         "--function-name", FUNCTION_NAME, 
                         "--runtime", "python3.12", 
                         "--zip-file", f"fileb://{FUNCTION_NAME}.zip", 
                         "--handler", f"{FUNCTION_NAME}.handler", 
                         "--role", arn_role, END_POINT], shell=True,
                        stdout=subprocess.PIPE,
                        universal_newlines=True)
print(result.returncode)
print(result.stdout)

# Invoke the lambda with the payload from payload.json
result = subprocess.run(["aws", "lambda", "invoke", 
                         "--function-name", FUNCTION_NAME, 
                         "--invocation-type", "Event",
                         "--payload", "file://payload.json", 
                         "response.json", END_POINT], shell=True,
                        stdout=subprocess.PIPE,
                        universal_newlines=True)
print(result.returncode)
print(result.stdout)
