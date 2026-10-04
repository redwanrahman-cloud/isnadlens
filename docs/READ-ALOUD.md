# Read-aloud and passage translations

Read-aloud uses the browser Web Speech API, with no IsnadLens paid speech request or redistributed voice recording. Voices are supplied by the browser/operating system and differ by device. A matching language voice is required: the application does not silently read Arabic, Bangla or another language with an English voice. Local voices are preferred; when a selected voice uses a remote speech service, the interface explains that its provider may receive the displayed text.

Playback begins only after a user click/tap. Listen/Stop controls work for the explanation, original passage and published translation. Long text is played in bounded chunks; starting another player, changing its text/language or unmounting it cancels that player's previous session. Missing voices and playback errors retain readable text. Browser synthesis is assistive reading, not a recording of Quran recitation or a claim of correct tajwid.

References: [available device voices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [local/remote voice distinction](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), [Web Speech API specification](https://webaudio.github.io/web-speech-api/).

Published translations are displayed alongside, never over, the sealed original evidence. Matching HadeethEnc editions share the publisher's record identifier; QuranEnc translations join to the original Quran by surah and ayah. Displaying or reading a translation does not rerun or strengthen the original verdict. Publisher notices, versions, footnotes and source links remain available. No AI-generated scripture translation is substituted when an edition is unavailable.

These interface/translation additions preserve Arabic and English as the supported fresh claim-input languages. Spanish, French and German extend display and explanation translations; independent linguistic review remains pending.
