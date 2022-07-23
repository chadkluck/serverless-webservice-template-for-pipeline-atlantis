# This bash script will generate and store 1 key in AWS Systems Manager Parameter Store
# To run:
# bash generate-put-keys.sh "{param-prefix}" {bit length}
# Where {param-prefix} will distinguish these generated parameters from all other parameters in your store.
# For example, "myApp" will generate "myApp/crypt_secureDataKey" in the parameter store
# "/WebApp/lds/cache-proxy" is what I use

# AWS ssm put-parameter borrowed from https://gist.github.com/TimothyJones/633c63b0a332692d85c518928ca20e5c
# Random string generation borrowed from # https://gist.github.com/earthgecko/3089509

usage() {
  {
    echo "Usage:"
#    echo "   ${BASH_SOURCE[0]} <PARAM_NAME_PREFIX> <KEY_LEN> <REGION_ID> <ACCOUNT_ID> <PROJECT_ID>"
    echo "   <SCRIPT.sh> <PARAM_NAME_PREFIX> <KEY_LEN> <REGION_ID> <ACCOUNT_ID> <PROJECT_ID> <PREFIX>"
    echo "      REGION_ID"
    echo "         The AWS Region"
    echo "      ACCOUNT_ID"
    echo "         The AWS Account"
    echo "      PROJECT_ID"
    echo "         The CodeStar Project ID"
    echo "      PARAM_NAME_PREFIX"
    echo "         The prefix to use for the SSM variable."
    echo "         For example, '/WebApp/labs/'"
    echo "         will generate 1 parameter to store named '/WebApp/labs/<PROJECT_ID>/crypt_secureDataKey'"
    echo "      KEY_LEN"
    echo "         The number of bits needed"
    echo "         For example, if you are using AES256 you need a key that is 256 bits. So you would enter 256"
    echo "      PREFIX"
    echo "         The project stack prefix such as 'codestar' or 'projectstack'"
  } >&2
}

# https://gist.github.com/earthgecko/3089509
generatekey() {
    local NEW_KEY=$(cat /dev/urandom | LC_CTYPE=C tr -dc 'abcdef0-9' | fold -w $KEY_LEN | head -n 1)
    echo $NEW_KEY
}

putkey() {

  local PARAM_FULL_NAME="$PARAM_NAME_PATH$1" # /path/to/project_id/variablename
  

  echo "Checking for SSM Parameter: $PARAM_FULL_NAME ..."

  if aws ssm get-parameter --name "$PARAM_FULL_NAME" > /dev/null 2>&1
  then
    echo "Parameter already exists. Skipping."
  else
    echo "...parameter does not exist..."
    echo "Generating key for SSM Parameter: $PARAM_FULL_NAME ..."
    local CIPHKEY=$(generatekey)
    
    local TAGS="Key=awscodestar:projectArn,Value=arn:aws:codestar:$REGION_ID:$ACCOUNT_ID:project/$PROJECT_ID"

    # Borrowed from https://aws.amazon.com/blogs/mt/using-aws-systems-manager-parameter-store-secure-string-parameters-in-aws-cloudformation-templates/
    # https://docs.aws.amazon.com/cli/latest/reference/ssm/put-parameter.html
    aws ssm put-parameter --type SecureString --name "$PARAM_FULL_NAME" --value "$CIPHKEY" --tags "$TAGS" --no-overwrite

  fi

}

# Confirm that there are at least 5 arguments
# Borrowed from https://gist.github.com/TimothyJones/633c63b0a332692d85c518928ca20e5c
if [ "$#" -lt 4 ]; then
  usage
  exit 1
fi

# Confirm that we have the AWS cli installed
# Borrowed from https://gist.github.com/TimothyJones/633c63b0a332692d85c518928ca20e5c
if ! [ -x "$(command -v "aws")" ]; then
  echo "Error: The aws-cli is not on the path. Perhaps it is not installed?"
  exit 1
fi

PARAM_NAME_PATH=$1
REGION_ID=$3
ACCOUNT_ID=$4

BITS=$2
DIVBY=4
KEY_LEN=$((BITS/DIVBY)) #divide number of bits needed by 4 because that is what hex will give us

putkey "crypt_secureDataKey"