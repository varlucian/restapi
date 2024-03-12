
build:
	docker build --platform="linux/amd64" -t rest-nodejs .

tag:
	docker tag rest-nodejs varlucian/rest-nodejs:${VERSION}

push: build tag
	docker push varlucian/rest-nodejs:${VERSION}
