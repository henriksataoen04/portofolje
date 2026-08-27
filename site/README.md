# Sataøen Media — nettside

Statisk side. Alt innhold ligger i `content/site.json` og redigeres i nettleseren på `/admin`.

## Sette opp (én gang, ca. 15 min)

1. **Lag repo på GitHub.** Nytt, tomt repo — f.eks. `sataoen-media`. Legg inn *innholdet* i denne mappen (index.html, app.js, admin/, content/, media/, netlify.toml) i repo-roten. Branch skal hete `main`.
2. **Koble til Netlify.** app.netlify.com → Add new site → Import from Git → velg repoet. Build command: tom. Publish directory: `.` Deploy.
3. **Slå på innlogging.** Netlify → Site configuration → Identity → Enable Identity. Under *Registration* velg **Invite only**. Under *Services → Git Gateway* trykk **Enable Git Gateway**.
4. **Inviter deg selv.** Identity → Invite users → din e-post. Åpne lenken i e-posten, sett passord.
5. **Logg inn på `dinside.netlify.app/admin`.** Nå kan du laste opp bilder, bytte hero-video, endre tekst og trykke publiser. Siden bygger seg selv om på ~30 sekunder.

## Hero-video

Kort, stum loop: **6–10 sekunder, maks ~15 MB, 1920×1080, mp4/H.264**. Komprimer f.eks. med HandBrake (Web-preset) eller:

    ffmpeg -i original.mov -t 8 -an -vf scale=1920:-2 -c:v libx264 -crf 26 -movflags +faststart reel.mp4

Last den opp under Hero i admin. Ingen video = stillbildet brukes i stedet.

## Domene senere

Netlify → Domain management → Add domain. Gratis SSL følger med.
