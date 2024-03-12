# Initial setup

## Namespaces

* Create namespaces: `gitops-nxm-v2`, `gitops-ns1`,  `gitops-ns2`
* Add label `istio-injection: enabled` to all 3 namespaces
* _Default_ namespace is `gitops-nxm-v2`.

## Provider

* Create a simple REST server and packaged in a docker container
  * Create the image and pushed to Docker Hub `varlucian/rest-nodejs:1.0.0`
* Create deployment: `kubectl create deployment provider --image=varlucian/rest-nodejs:1.0.0 --port=80`
  * and service: `kubectl create service clusterip provider --tcp=80:80`
* Port-forward the service: `kubectl port-forward svc/provider 8080:80`
* Query the provider: `curl http://localhost:8080/req/123`
{"id":"123","name":"Provider response for 123"}

## Consumer

* Create deployment: `kubectl create deployment consumer --image=curlimages/curl:8.6.0 -- sleep 600`
* Shell into de container: `kubectl exec -it consumer-5467ff778b-7wx2l -c curl -- sh`
  * Query the provider: `curl provider/req/123`
{"id":"123","name":"Provider response for 123"}
* Or query directly: `kubectl exec -it consumer-5467ff778b-7wx2l -c curl -- curl provider/req/345`
{"id":"345","name":"Provider response for 345"}%


# Provider migration

## Migration to gitops-ns1

* Create provider deployment in the new namespace: `kubectl create deployment -n gitops-ns1  provider --image=varlucian/rest-nodejs:1.0.0 --port=80`
    * and also a service: `kubectl create service -n gitops-ns1 clusterip provider --tcp=80:80`
* Then
    * `kubectl exec -it consumer-5467ff778b-7wx2l -c curl -- curl provider.gitops-nxm-v2/req/345`
        {"id":"345","name":"Provider response for 345"}%
    * `kubectl exec -it consumer-5467ff778b-7wx2l -c curl -- curl provider.gitops-ns1/req/345`
        {"id":"345","name":"Provider response for 345"}%


# Scenarios

The provider is migrated to `gitops-ns1`.

The consumer is migrated to `gitops-ns2`.

The VS is redirecting `provider` and `provider.gitops-nxm-v2` to `gitops-ns1`.
| Consumer ns   | VS ns         | Query                    | Reply from                                 | Comment                                                               |
| ------------- | ------------- | ------------------------ | ------------------------------------------ | --------------------------------------------------------------------- |
| gitops-nxm-v2 |               | provider                 | gitops-nxm-v2                              | Before migration: both are in nxm-v2                                  |
|               |               | provider.gitops-nxm-v2   | gitops-nxm-v2                              | Before migration: both are in nxm-v2                                  |
|               |               | provider.gitops-ns1      | gitops-ns1                                 | --- Irrelevant (consumer needs to change)                             |
|               | gitops-nxm-v2 | provider[.gitops-nxm-v2] | gitops-ns1                                 | --- VS better to be installed in the provider namespace               |
|               | gitops-nxm-v2 | provider.gitops-ns1      | gitops-ns1                                 | --- VS better to be installed in the provider namespace               |
|               | gitops-nxm-v2 | provider.gitops-ns2      | gitops-ns2                                 | --- Irrelevant (provider is not installed in ns2)                     |
|               | gitops-ns1    | provider[.gitops-nxm-v2] | gitops-ns1                                 | Provider migration: VS installed in provider namespace                |
| gitops-ns2    | gitops-ns1    | provider                 | curl: (6) Could not resolve host: provider | Consumer migration: !!! NOT what we want !!! We'd expect to go in ns1 |
| gitops-ns2    | gitops-ns1    | provider.gitops-nxm-v2   | gitops-ns1                                 | Consumer migration: OK                                                |


## Migration steps

* Initially, both provider and consumer are in nxm-v2 namespace
*
