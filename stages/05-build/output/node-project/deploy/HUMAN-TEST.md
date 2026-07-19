# Happy Box human test

Public URL: <https://happybox.littlelinkedlibrarian.com>

## Connect as the local operator

Retrieve the token on the host without copying it into chat or source control:

```bash
sed -n 's/^OPERATOR_TOKEN=//p' /home/zaxaz/lll-happybox/runtime.env
```

Open the public URL, choose **Operator access**, paste the token, and connect.

## Suggested review path

1. Switch between **Garden**, **Terminal**, and **Cosmic**. Reload once and confirm the selection persists.
2. Open **Library boxes** and confirm **Happy Box** shows `66 Colon Ave, St. Augustine, FL 32084`.
3. Confirm the seeded catalog contains three books across two boxes.
4. Open **Assorted Things**. One pending “Little Linked Librarian badge” fixture should be present.
5. Open that fixture and review its image, proposed metadata, three explicit unknowns, and three human questions. Edit it, then either confirm or reject it. No book should be created.
6. Create a temporary box, edit its name/location, then delete it while empty.
7. Add a manual book to Happy Box, edit or move it, search for it, and delete it.
8. Upload a non-sensitive book-cover image in **Scanner**, inspect the GPT-5.6 proposal, and explicitly confirm or reject it.
9. Reload the page and confirm all completed writes persist.

## Boundaries worth checking

- Opening `/api/manage/assorted` without operator access returns `401`.
- Public `/api/boxes` includes Happy Box, but private Assorted Things data is absent from the Central-compatible reads.
- The application remains usable for manual CRUD if an OpenAI request fails.
- The beta Central application remains at <https://beta.littlelinkedlibrarian.com>.

## Operations

Create another integrity-verified online backup:

```bash
cd /home/zaxaz/business_roadmap/public/lll-icm-node-builder/stages/05-build/output/node-project
./deploy/backup-host.sh
```

Container status and logs:

```bash
docker compose --project-name happybox \
  --env-file /home/zaxaz/lll-happybox/runtime.env \
  -f compose.production.yaml ps
docker logs --tail 100 lll-happybox
```
