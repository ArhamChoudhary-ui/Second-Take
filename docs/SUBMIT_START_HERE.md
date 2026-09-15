# Second Take — submission pack

Second Take helps people preview, approve, correct and recover an assistant’s bookings. The demo’s strongest moment is a camera reservation that succeeded while its confirmation was lost: the assistant checks the existing record and finishes without booking a second camera.

The code and written materials are prepared. The hackathon entry has not been submitted. The current hosted app is owner-private; a source archive is not a public GitHub repository, and a script is not a demo video.

## Entry to prepare

**Primary track:** Alexa+ simulated experience, supported by a working MCP Streamable HTTP endpoint implementing protocol version 2025-11-25.

**Mini challenge:** Open Source, after you publish the MIT-licensed project during the eligible window and provide the repository, contribution link and GitHub username. Leave AWS Builder unselected for this build: the optional Bedrock adapter has not been connected or demonstrated.

This positioning follows the organizer’s [requirements](https://amazonappdev2026.devpost.com/) and [official rules](https://amazonappdev2026.devpost.com/rules), checked September 15, 2026. The deadline shown is October 23, 2026 at noon Pacific daylight time: October 24 at 00:30 India Standard Time. Recheck the organizer page before submitting.

## Files to use

| Need | Prepared file |
|---|---|
| Text for the project form | `docs/DEVPOST_DRAFT.md` |
| English narration and exact screen actions | `docs/DEMO_SCRIPT.md` |
| How the app works and presenter questions | `docs/START_HERE.md` |
| Tool/API feedback | `docs/PRODUCT_FEEDBACK.md` |
| Observed friction and suggestions | `docs/FRICTION_LOG.md` |
| Evidence and remaining test gaps | `docs/TEST_REPORT.md` |
| Public repository setup | `docs/GITHUB_PUBLICATION.md` |
| Work dates, starter and AI assistance disclosure | `docs/BUILD_DISCLOSURE.md` |
| Source and verification commands | `README.md` |
| Complete final checklist | `docs/SUBMISSION_CHECKLIST.md` |

## Finish these account steps

1. Extract the source archive and publish the project files to a public GitHub repository you own. Keep `LICENSE` at the root. Wait for the included verification workflow and resolve any runner-specific problems. Follow `GITHUB_PUBLICATION.md`.
2. Record the actual app using `DEMO_SCRIPT.md`. Keep the guided and simulation labels visible. Time the finished file and upload it publicly to YouTube or Vimeo. The script targets 2:40, but it is not evidence of the recording’s duration.
3. Give judges a usable access route. The public repository’s local run instructions and public video must work without your account. If offering a hosted demo, explicitly share or publish access and test it signed out. The existing private URL alone is insufficient access.
4. Fill your actual name/team, GitHub username, repository, contribution and video URLs. Review the build disclosure and product feedback in your own words. Confirm eligibility and complete the Devpost form before its deadline.

No purchased service, hardware or live LLM is needed to run the simulated project. Any live-provider integration would be separate work requiring credentials, supported APIs and verification.

## Final rehearsal

Use one browser tab. Open `/demo` and start The missing confirmation. Preview → approve → inspect the camera’s saved record → Check & resume. Show one camera record and zero duplicates. Then demonstrate The edit that stays yours. In your normal workspace, try a restaurant request, revise the preview, approve, and download its labelled calendar snapshot.

The key claim is implemented recovery behavior, not universal language understanding or a guarantee that every external action can be undone. No award or judging outcome can be guaranteed.
