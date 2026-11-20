# User language catalogue

`user-languages.json` contains ISO 639-3 codes, names and optional ISO 639-1
aliases from [pycountry 26.2.16](https://pypi.org/project/pycountry/26.2.16/).
The catalogue matches the version used by the backend's language validation.
It is loaded separately from the application bundle, and common language names
are localized with `Intl.DisplayNames`.

The upstream data comes from Debian's iso-codes project. Its LGPL 2.1 license
is included in `user-languages.LICENSE.txt`.

To regenerate with the matching pycountry version installed:

```python
import json
from pathlib import Path

import pycountry

languages = {
    language.alpha_3: {
        "name": language.name,
        **({"alpha2": language.alpha_2} if hasattr(language, "alpha_2") else {}),
    }
    for language in pycountry.languages
}
Path("public/data/user-languages.json").write_text(
    json.dumps(languages, ensure_ascii=False, separators=(",", ":")) + "\n"
)
```
