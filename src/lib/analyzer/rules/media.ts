import { attr, tagOf, type ParsedElement } from "../dom";
import { MEDIA_TAGS } from "../aria-data";
import { finding, type Rule, type RuleFinding } from "../types";

function hasCaptionTrack(el: ParsedElement): boolean {
  return el.querySelectorAll("track").some((track) => {
    const kind = (attr(track, "kind") ?? "").toLowerCase();
    return kind === "captions" || kind === "subtitles";
  });
}

/** Rules about time-based media (WCAG 1.2.x, 1.4.2). */
export const mediaRules: Rule[] = [
  {
    id: "video-captions-missing",
    title: "Video has no captions track",
    description:
      "Prerecorded video with audio needs synchronised captions for Deaf and hard of hearing users.",
    category: "media",
    severity: "serious",
    wcag: ["1.2.2"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "video")
        .filter((el) => attr(el, "aria-hidden") !== "true")
        .filter((el) => !hasCaptionTrack(el))
        .map((el) =>
          finding("This <video> has no captions/subtitles track.", el, {
            suggestion:
              "Add a <track kind=\"captions\" src=\"captions.vtt\" srclang=\"en\" label=\"English\" default> and provide a transcript.",
            codeExample: {
              before: '<video src="demo.mp4" controls></video>',
              after:
                '<video src="demo.mp4" controls>\n  <track kind="captions" src="demo.en.vtt" srclang="en" label="English" default>\n</video>',
            },
          }),
        ),
  },
  {
    id: "audio-transcript-missing",
    title: "Audio has no captions or transcript",
    description:
      "Audio-only content needs a transcript (and captions where speech is present) at minimum for WCAG 1.2.1.",
    category: "media",
    severity: "moderate",
    wcag: ["1.2.1"],
    run: (ctx) =>
      ctx.elements
        .filter((el) => tagOf(el) === "audio")
        .filter((el) => attr(el, "aria-hidden") !== "true")
        .filter((el) => !hasCaptionTrack(el))
        .map((el) =>
          finding("This <audio> element has no captions track.", el, {
            suggestion:
              "Provide a text transcript and, where there is speech, a <track kind=\"captions\">.",
          }),
        ),
  },
  {
    id: "media-autoplay-audio",
    title: "Media autoplays with sound",
    description:
      "Autoplaying audio that lasts more than three seconds must be pausable or muted (WCAG 1.4.2).",
    category: "media",
    severity: "moderate",
    wcag: ["1.4.2"],
    run: (ctx) => {
      const findings: RuleFinding[] = [];
      for (const el of ctx.elements) {
        if (!MEDIA_TAGS.has(tagOf(el))) continue;
        if (attr(el, "autoplay") === undefined) continue;
        if (attr(el, "muted") !== undefined) continue;
        findings.push(
          finding("This media element autoplays with audio enabled.", el, {
            suggestion:
              "Add muted (and controls) or remove autoplay so users are not surprised by sound.",
          }),
        );
      }
      return findings;
    },
  },
];
