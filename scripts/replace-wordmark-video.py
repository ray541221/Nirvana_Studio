#!/usr/bin/env python3
"""Replace the source video's wordmark without smearing the liquid-gold artwork."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def build_wordmark_mask(frame: np.ndarray) -> np.ndarray:
    """Find the original white wordmark and keep only its glyph-sized regions."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mask = np.zeros(gray.shape, dtype=np.uint8)
    region = (gray[380:700, 80:1840] >= 245).astype(np.uint8) * 255

    # Remove isolated bright flecks from the artwork while retaining the large
    # connected glyphs, including punctuation dots.
    components, labels, stats, _ = cv2.connectedComponentsWithStats(region, 8)
    kept = np.zeros_like(region)
    for component in range(1, components):
        area = stats[component, cv2.CC_STAT_AREA]
        if area >= 18:
            kept[labels == component] = 255

    mask[380:700, 80:1840] = kept
    # Cover anti-aliased edges, but keep the mask limited to the glyph shapes.
    return cv2.dilate(mask, np.ones((3, 3), dtype=np.uint8), iterations=1)


def overlay_logo(frame: np.ndarray, logo: np.ndarray) -> None:
    """Alpha-composite the supplied same-font wordmark in its source position."""
    if logo.shape[2] == 4:
        logo_bgr = logo[:, :, :3]
        alpha = logo[:, :, 3].astype(np.float32) / 255.0
    else:
        logo_bgr = logo
        alpha = np.ones(logo.shape[:2], dtype=np.float32)

    height, width = logo_bgr.shape[:2]
    x = (frame.shape[1] - width) // 2
    y = 420
    if x < 0 or y < 0 or x + width > frame.shape[1] or y + height > frame.shape[0]:
        raise ValueError("Wordmark does not fit inside the source video frame")

    roi = frame[y : y + height, x : x + width].astype(np.float32)
    alpha = alpha[:, :, None]
    roi[:] = logo_bgr.astype(np.float32) * alpha + roi * (1.0 - alpha)
    frame[y : y + height, x : x + width] = np.clip(roi, 0, 255).astype(np.uint8)


def replace_wordmark(source: Path, logo_path: Path, output: Path) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open source video: {source}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if width <= 0 or height <= 0:
        raise RuntimeError("Source video has no readable dimensions")

    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
    ok, early_mask_frame = capture.read()
    if not ok:
        raise RuntimeError("Unable to read an opening frame for the wordmark mask")
    capture.set(cv2.CAP_PROP_POS_MSEC, 34_000)
    ok, late_mask_frame = capture.read()
    if not ok:
        late_mask_frame = early_mask_frame
    early_mask = build_wordmark_mask(early_mask_frame)
    late_mask = build_wordmark_mask(late_mask_frame)
    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)

    logo = cv2.imread(str(logo_path), cv2.IMREAD_UNCHANGED)
    if logo is None:
        raise RuntimeError(f"Unable to open wordmark: {logo_path}")

    output.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )
    if not writer.isOpened():
        raise RuntimeError("Unable to create intermediate video")

    frame_index = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            time_s = frame_index / fps
            if time_s < 8.0 or time_s >= 31.0:
                mask = early_mask if time_s < 8.0 else late_mask
                frame = cv2.inpaint(frame, mask, 3, cv2.INPAINT_TELEA)
                overlay_logo(frame, logo)
            writer.write(frame)
            frame_index += 1
            if frame_index % 300 == 0:
                print(f"processed {frame_index}/{frame_count} frames", flush=True)
    finally:
        capture.release()
        writer.release()

    if frame_index == 0:
        raise RuntimeError("No frames were written")
    print(f"wrote {frame_index} frames to {output}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--wordmark", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    replace_wordmark(args.source, args.wordmark, args.output)


if __name__ == "__main__":
    main()
