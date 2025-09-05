Images Generation Tool

Generates caricature images for all combinations of configurable attributes and a rotating list of celebrities, using OpenAI Images. Deterministic with a seed, concurrent with retries, and skip-regenerates unless override=true.

Quick Start
- Requirements: Python 3.11
- Setup:
  - cd images-generation
  - python -m venv .venv && .venv/bin/pip install -U pip     # Windows: .venv\\Scripts\\Activate.ps1
  - source .venv/bin/activate                                 # Windows: .venv\\Scripts\\Activate.ps1
  - pip install -r requirements.txt
  - cp .env.example .env   # add your OPENAI_API_KEY
  - cp config.yaml.example config.yaml
  - python -m images_generation

CLI
- Dry run: `python -m images_generation --dry-run`
- Verbose logs: `python -m images_generation -v`
- Model: set in `config.yaml` under `image.model` (default `gpt-image-1`).
- Size: set `image.size` to one of `1024x1024`, `1024x1536`, `1536x1024`, or `auto`.

Config Notes
- Attributes are dynamic; order defines bit positions and filename encoding.
- Abbreviations are auto-generated from attribute ids (e.g., underground_veteran -> UV). Collisions are resolved by extending tokens.
- Filenames include encoded bits: e.g., celebslug__UV1_INT0_FF1.webp
- Output per scenario: output/scenario_{N}/ with manifest.json
- If an image already exists and override=false, it is skipped.
- Reference image: if `image.attach_image_path` is set in `config.yaml`, the tool attaches that file to the request (Images edits endpoint) and the prompt adds: "Use the attached image as a reference for who {celebrity} is."

Manifest
- Written to scenario folder as manifest.json
- Each entry: { filename, celebrity, attributes, scenario, size, createdAt }

Tips
- Use small concurrency and built-in retries to avoid rate limits.
- Keep seed fixed to reproduce celeb assignment and order.
- Errors are saved to `output/scenario_{N}/errors.json` and printed (first 5) in non-verbose mode. Use `-v` to see per-file logs while running.

Edge Case Logic
- If an image’s attributes include `international: true`, the assignment will not pick “Angela Merkel” or “Olaf Scholz” for that image. This is a small, deterministic rule applied during celebrity rotation; everything else remains unchanged.
