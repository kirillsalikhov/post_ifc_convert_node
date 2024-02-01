#!/usr/bin/env bash

while [ $# -gt 0 ]; do
  case "$1" in
    --utils-local-path=*)
      utils_local_path="${1#*=}"
      ;;
    *)
      printf "***************************\n"
      printf "* Error: Invalid argument.*\n"
      printf "***************************\n"
      exit 1
  esac
  shift
done

pushd "$(dirname "$(readlink -f "$0")")" || exit 1

version=$(cat ../converter/VERSION)
#utils_git_path="git@bitbucket.org:webgears/converter-utils_node.git"
utils_version="-local"
harbor_path="docker.webgears3d.com/converters/"
converter_name=$(cat ../converter/config.json | grep -o '"name": "[^"]*' | grep -o '[^"]*$' | head -1)
base_image_name="${converter_name}:${version}"
image_name="${harbor_path}${converter_name}:${version}-utils${utils_version}"
queue=${converter_name}

docker build -t ${base_image_name} \
  -f ../Dockerfile ../..

popd || exit 1

# if utils_local_path is not set, build with utils from git
#if [[ -z "$utils_local_path" ]]
#then
#  printf "***************************\n"
#  printf "building with utils from git\n"
#  printf "***************************\n"
#  docker build -t ${image_name} \
#  --build-arg base_image=${base_image_name} \
#  --build-arg queue=${queue} ${utils_git_path}
## if utils_local_path is set, build from local utils
#else
  printf "***************************\n"
  printf "building with utils from utils_local_path\n"
  printf "***************************\n"
  docker build -t ${image_name} \
    -f ${utils_local_path}/Dockerfile \
    --build-arg base_image=${base_image_name} \
    --build-arg queue=${queue} ${utils_local_path}
# fi
