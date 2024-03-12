# Initial setup

## Namespaces

Create namespaces: `gitops-v2`, `gitops-provider`,  `gitops-consumer` with `istio-injection: enabled` label

```shell
kubectl create namespace gitops-v2
kubectl create namespace gitops-provider
kubectl create namespace gitops-consumer
kubectl label namespace gitops-v2 istio-injection=enabled
kubectl label namespace gitops-provider istio-injection=enabled
kubectl label namespace gitops-consumer istio-injection=enabled
```

## Provider

Create provider deployment and services in corresponding namespaces

```shell
kubectl apply -n gitops-v2 -f deployment.yaml
kubectl apply -n gitops-provider -f deployment.yaml
kubectl create service -n gitops-v2 clusterip provider --tcp=80:80
kubectl create service -n gitops-provider clusterip provider --tcp=80:80
```


<!-- * Create a simple REST server and packaged in a docker container
  * Create the image and pushed to Docker Hub `varlucian/rest-nodejs:1.0.0`
* Create deployment: `kubectl create deployment provider --image=varlucian/rest-nodejs:1.0.0 --port=80`
  * and service: `kubectl create service clusterip provider --tcp=80:80`
* Port-forward the service: `kubectl port-forward svc/provider 8080:80`
* Query the provider: `curl http://localhost:8080/req/123`
{"id":"123","name":"Provider response for 123"} -->

## Consumer

* Create consumer `curl` pod

```shell
kubectl apply -n gitops-v2 -f client/pod.yaml
```

Test by querying the provider

```shell
kubectl exec -n gitops-v2 -it consumer -c curl -- curl provider/req/345
```

The response should be
```json
{"id":"345","name":"Provider response for 345"}
```

## Virtual service

Create a virtual service in e.g. `gitops-v2` namespace

```shell
kubectl apply -n gitops-v2 -f virtual.yaml
```


## Helper terminal commands

```shell
watch 'echo "Services:"; for ns in gitops-v2 gitops-provider gitops-consumer; do echo "* $ns"; kubectl get svc --no-headers -n $ns; done'
watch 'echo "Pods"; for ns in gitops-v2 gitops-provider gitops-consumer; do echo "* $ns"; kubectl get pod --no-headers -n $ns; done'
watch 'echo "Virtual services"; for ns in gitops-v2 gitops-provider gitops-consumer; do echo "* $ns"; kubectl get vs --no-headers -n $ns; done'
```


# Scenarios

The provider is migrated to `gitops-provider`.

The consumer is migrated to `gitops-consumer`.

The VS is redirecting `provider` and `provider.gitops-v2` to `gitops-provider`.
| Consumer ns     | VS ns           | Query                    | Reply from                                 | Comment                                                                           |
| --------------- | --------------- | ------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------- |
| gitops-v2       |                 | provider                 | gitops-v2                                  | Before migration: both are in gitops-v2                                           |
|                 |                 | provider.gitops-v2       | gitops-v2                                  | Before migration: both are in gitops-v2                                           |
|                 |                 | provider.gitops-provider | gitops-provider                            | --- Irrelevant (consumer needs to change)                                         |
|                 | gitops-v2       | provider[.gitops-v2]     | gitops-provider                            | --- VS better to be installed in the provider namespace                           |
|                 | gitops-v2       | provider.gitops-provider | gitops-provider                            | --- VS better to be installed in the provider namespace                           |
|                 | gitops-v2       | provider.gitops-consumer | gitops-consumer                            | --- Irrelevant (provider is not installed in gitops-consumer)                     |
|                 | gitops-provider | provider[.gitops-v2]     | gitops-provider                            | Provider migration: VS installed in provider namespace                            |
| gitops-consumer | gitops-provider | provider                 | curl: (6) Could not resolve host: provider | Consumer migration: !!! NOT what we want !!! We'd expect to go in gitops-provider |
| gitops-consumer | gitops-provider | provider.gitops-v2       | gitops-provider                            | Consumer migration: OK                                                            |


## Migration steps

* Initially, both provider and consumer are in gitops-v2 namespace
*
