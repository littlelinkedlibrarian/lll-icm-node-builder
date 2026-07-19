# Happy Box host deployment

The judge deployment runs the reference node in Docker while the existing k3s Istio gateway and remotely managed Cloudflare tunnel provide public ingress.

- Container origin: `192.168.0.141:13056`
- Public origin: `https://happybox.littlelinkedlibrarian.com`
- Runtime secrets: `/home/zaxaz/lll-happybox/runtime.env` (`0600`, never committed)

Retrieve the operator token locally when needed:

```bash
sed -n 's/^OPERATOR_TOKEN=//p' /home/zaxaz/lll-happybox/runtime.env
```

- Canonical SQLite data: `/home/zaxaz/lll-happybox/data`
- SQLite-safe backups: `/home/zaxaz/lll-happybox/backups`
- Cluster bridge: `happybox-docker` Service plus EndpointSlice in namespace `lll`
- Exact-host route: `happybox-route`; the existing Central route is unchanged

Start or update:

```bash
docker compose --project-name happybox \
  --env-file /home/zaxaz/lll-happybox/runtime.env \
  -f compose.production.yaml up -d --build
kubectl apply -f deploy/k8s-happybox-route.yaml
```

Create a verified online backup:

```bash
./deploy/backup-host.sh
```

Rollback the public route without deleting data:

```bash
kubectl delete -f deploy/k8s-happybox-route.yaml
```

Stop the container without deleting host data or backups:

```bash
docker compose --project-name happybox \
  --env-file /home/zaxaz/lll-happybox/runtime.env \
  -f compose.production.yaml down
```
