import {ApiObjectMetadata, App, Chart} from "cdk8s";
import {Construct} from "constructs";
import {Deployment, Ingress, IngressBackend, Service} from "cdk8s-plus-24";

const GITHUB_OWNER: string = {{<PROJECT_OWNER>}};
const GITHUB_REPOSITORY: string = {{<PROJECT_NAME>}}
const NAMESPACE: string = "index"
const TAG: string = process.argv[2];

interface NathanServiceConfig {
    namespace: string;
    name: string;
}

class NathanService extends Chart {

    public constructor(scope: Construct, config: NathanServiceConfig) {
        super(scope, `${GITHUB_REPOSITORY}-${NAMESPACE}`);
        const metadata: ApiObjectMetadata = {};
        const deployment = new Deployment(this, "deployment", {
            metadata,
            containers: [{
                image: `ghr.io/${GITHUB_OWNER}/${GITHUB_REPOSITORY}:${TAG}`
            }]
        });
        const service = new Service(this, "service", {
            metadata,
            selector: deployment,
            ports: [{
                port: 80,
                targetPort: 5000
            }]
        });
        new Ingress(this, "ingress", {
            metadata,
            rules: [{
                backend: IngressBackend.fromService(service),
                path: `/${config.namespace}/${config.name}`
            }]
        });
    }
}

const app = new App();
new NathanService(app, {
    name: "web-ui",
    namespace: "index"
});
app.synth();
