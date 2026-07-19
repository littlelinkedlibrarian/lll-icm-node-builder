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
4. Create a temporary box, edit its name/location, then delete it while empty.
5. Add a manual book to Happy Box, edit or move it, search for it, and delete it.
6. In **Scanner**, select **Books**, Happy Box, and a non-sensitive photo containing at least three visible book spines. On mobile, choose the camera when the browser offers it.
7. Review every result in the single batch modal. Edit only incorrect extraction fields; choose an offered edition for one result, leave another as **no edition**, confirm at least two, and reject one. No edition should be selected automatically.
8. Open **Activity History**, reopen that parent scan, and verify the original image, zoom controls, timeline, and all confirmed/rejected child outcomes.
9. Return to the catalog and verify confirmed books appear. A selected edition should show its cover when Open Library supplied one; unmatched books should use the spine placeholder.
10. In **Scanner**, select **Assorted things**, capture a puzzle, card, art object, or trinket, and enter the human description yourself. Confirm it appears only inside Happy Box with a zoomable image; this path must not call OpenAI.
11. Reload the page and confirm all completed writes and Activity History persist.

## Boundaries worth checking

- Opening `/api/manage/activities` or `/api/manage/assorted` without operator access returns `401`.
- Opening a protected activity image without the bearer token returns `401`.
- Public `/api/boxes` includes Happy Box, but private Assorted Things data is absent from the Central-compatible reads.
- If OpenAI extraction fails, the application remains usable and the failed activity keeps its uploaded image in protected history.
- The beta Central application remains at <https://beta.littlelinkedlibrarian.com>.

## Operations

Create another paired SQLite-and-media backup:

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
