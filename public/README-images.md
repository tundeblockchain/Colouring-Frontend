# Dashboard card images

Place these image files in this `public` folder so the "Create a coloring page" dashboard cards display correctly:

| Filename        | Card        |
|-----------------|-------------|
| `text-prompts.jpg` | Text prompts |
| `word-art.jpg`     | Word Art     |
| `photos.jpg`       | Photos       |

- **Format:** JPG or PNG (rename the paths in `src/screens/Dashboard.jsx` if you use `.png`).
- **Suggested size:** About 400×300 px or similar (cards use `object-fit: cover` and height 200px).

Files in `public/` are served from the site root (e.g. `public/text-prompts.jpg` → `/text-prompts.jpg`).
