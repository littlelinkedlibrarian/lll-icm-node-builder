# Happy Box human test

Public URL: <https://happybox.littlelinkedlibrarian.com>

## Hackathon public demo

When `PUBLIC_DEMO_OPERATOR=true`, open the public URL directly. The header says **Public demo mode**, and browser scanning, review, history, and CRUD require no token. When `PUBLIC_DEMO_MCP=true` is also explicitly enabled, ChatGPT developer mode can connect to the public `/mcp` URL without OAuth; every advertised MCP tool is then public until the flag is disabled.

For the normal protected mode, connect as the local operator:

Retrieve the token on the host without copying it into chat or source control:

```bash
sed -n 's/^OPERATOR_TOKEN=//p' /home/zaxaz/lll-happybox/runtime.env
```

Open the public URL, choose **Operator access**, paste the token, and connect.

## Suggested review path

1. Switch between **Garden**, **Terminal**, and **Cosmic**. Reload once and confirm the selection persists.
2. Open **Library boxes** and confirm **Happy Box** shows `66 Colon Ave, St. Augustine, FL 32084`.
3. Choose **Prepare real demo** and confirm Happy Box uses the real outdoor box photo and the catalog is not populated with fictional seed records. Run it again and confirm it does not duplicate the box or alter existing books.
4. Create a temporary box, edit its name/location, then delete it while empty.
5. Select Happy Box anywhere on its card, then select a book inside its inventory and verify the cover, description, ISBN, language, condition, publication year, and box appear in Book details. For a book missing enrichment, choose **Find metadata & cover**, review the returned editions, explicitly apply one, and verify its cover, ISBN, source, and available description appear. Add a disposable manual book, edit or move it, search for it, then delete it from the detail modal.
6. In **Scanner**, expand **Use a real shelf photo**, download one supplied shelf image, select **Books** and Happy Box, then upload the image. Confirm a clearly bordered thumbnail, filename, type, and size appear before submission. On mobile, also verify the camera path when the browser offers it.
7. Review every result in the single batch modal. Edit only incorrect extraction fields; choose an offered edition for one result, leave another as **no edition**, confirm at least two, and reject one. No edition should be selected automatically.
8. Open **Activity History**, reopen that parent scan, and verify the entire uncropped original image, zoom controls, timeline, and all confirmed/rejected child outcomes.
9. Return to the catalog and verify confirmed books appear. A selected edition should show its cover when Open Library supplied one; unmatched books should use the spine placeholder.
10. In **Scanner**, select **Assorted things**, capture a puzzle, card, art object, or trinket, and enter the human description yourself. Confirm it appears only inside Happy Box with a zoomable image; this path must not call OpenAI. If the immediate review panel cannot open, verify the UI says the photo was saved safely and that it can be reopened from the box.
11. Search for the same English catalog concept using Spanish, Simplified Chinese, Italian, and French phrases. Record the result order and mode; this is the live multilingual quality evidence.
12. Reload and confirm all completed writes and Activity History persist. After judging, disable `PUBLIC_DEMO_OPERATOR`, then verify logout returns the browser to public read-only access and operator login restores management.

## Central companion loop

After the Central operator has approved `lll-happy-box` and the node log shows `Central heartbeat accepted`:

1. Open <https://beta.littlelinkedlibrarian.com> and navigate to the boxes/catalog surface.
2. Confirm **Happy Box** appears as a network result labeled with the Happy Box node source.
3. Open the network box modal, inspect its current books, then follow the node link to the branded Happy Box application.
4. As the local operator, create or scan and confirm a disposable book in Happy Box. Do not use a Central user token for this write.
5. Return to Central and refresh the same network box. Confirm the book appears without a replication or sync step.
6. Delete the disposable book in Happy Box, refresh Central again, and confirm it disappears.
7. Confirm Assorted Things, scan originals, activity history, operator controls, and local credentials never appear in Central responses.

## Boundaries worth checking

- In normal mode, `/api/manage/*` and protected images return `401` without operator access. In explicit public demo mode, browser management routes are open and the UI clearly labels that state.
- `/mcp` remains protected unless the separate `PUBLIC_DEMO_MCP=true` flag is enabled for the time-bounded ChatGPT demonstration.
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
