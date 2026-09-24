# Third-party notices

Ce fichier contient désormais **deux choses de nature différente**, et les
confondre serait une faute dans les deux sens.

1. **Une obligation en cours** — la police **Hack**, dont les fichiers sont
   réellement distribués avec la vitrine déployée. Sa licence MIT exige que sa
   notice accompagne cette distribution. Cette partie du fichier n'est pas
   facultative.
2. **Une attribution historique** — **`react-magic-ui`**, dont plus une ligne
   n'est distribuée. L'obligation MIT ne s'applique plus ; la notice est gardée
   parce qu'elle est vraie et utile, pas parce qu'elle est due.

Les textes de licence sont en anglais : une licence se recopie, elle ne se
traduit pas.

---

## react-magic-ui — attribution historique, plus une obligation

> **Ce code n'est plus distribué.** La clause de la MIT — « the above copyright
> notice […] shall be included in all copies or substantial portions of the
> Software » — ne s'applique qu'à une copie ou à une portion substantielle
> distribuée. Il n'y en a plus. **Cette section ne décrit donc aucune obligation
> juridique en cours**, et il serait malhonnête de la présenter comme telle.

**Pourquoi la garder, alors.** Trois raisons, et la première suffirait.

- **La réécriture s'est faite en regardant l'original.** Les composants
  d'aujourd'hui ne partagent plus une ligne avec lui, mais ils partagent son
  découpage, ses noms de props, et pour le matériau son idée. Une réécriture
  informée par une source n'est pas un plagiat et n'appelle aucune notice ; elle
  appelle quand même qu'on dise d'où vient l'idée, parce que c'est la vérité de
  l'histoire du dossier.
- **Le dossier porte encore son nom.** `src/magic/` s'appelle ainsi à cause de
  cette librairie, et le préfixe de classe `opale-magic-` en découle. Sans cette
  section, ce nom devient une énigme — exactement le genre de question qu'on se
  repose tous les six mois faute d'une réponse écrite quelque part.
- **Supprimer une attribution ne coûte rien et ne rapporte rien.** Le fichier ne
  pèse sur personne ; l'effacer ferait disparaître une information vraie pour un
  gain nul.

**Ce qui en venait** : les quatorze composants de `src/magic/components/` et
leurs feuilles `*.module.scss`, copiés au caractère depuis la version 1.0.9.

**Ce qu'il en reste** : rien. Huit des quatorze composants (`Badge`, `Button`,
`Card`, `Checkbox`, `Input`, `Select`, `Slider`, `Switch`) ont été **supprimés**,
n'étant plus que des peaux posées sous la prop `liquidGlass` d'un composant
d'Opale portant le même nom. Les six autres (`Glass`, `Modal`, `Tabs`, `Toast`,
`Topbar`, `Sidebar`) ont été **réécrits intégralement**, matériau compris.
L'échafaudage Tailwind qui servait leurs `@apply` est parti avec eux, et
**Tailwind, PostCSS et Autoprefixer sont sortis des dépendances du paquet**.

- **Source** : <https://github.com/tweeedlex/react-magic-ui>
- **Version qui avait été copiée** : 1.0.9
- **Licence** : MIT, Copyright (c) 2025 tweeedlex

Le texte de la licence est reproduit ci-dessous **pour mémoire**, afin que la
section soit lisible sans aller chercher le dépôt d'origine.

```
MIT License

Copyright (c) 2025 tweeedlex

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Hack — obligation en cours

**Celle-ci est due, et il faut la laisser où elle est.** La police monospace des
exemples de code de la vitrine est distribuée : `npm run build` émet ses fichiers
dans `dist-showcase/assets/` (vérifié — `hack-regular-*.woff2`,
`hack-italic-*.woff`, `hack-bold-*.woff2` et leurs pairs), et c'est ce dossier
qui est déployé. Distribuer la police, c'est en distribuer une copie ; la clause
MIT s'applique donc pleinement, ainsi que la licence Bitstream Vera que le projet
reproduit.

**Le paquet npm, lui, n'embarque pas la police** : `dist/` n'en contient aucun
fichier, et `hack-font` est une dépendance de développement. L'obligation porte
sur la vitrine déployée, pas sur `@thomascaron/opale-ui`.

- **Ce qui en vient** : la police monospace des exemples de code de la vitrine.
- **Source** : <https://github.com/source-foundry/Hack>
- **Version** : 3.3.0
- **Licence** : MIT, avec les notices Bitstream Vera reproduites par le projet.

```
The work in the Hack project is Copyright 2018 Source Foundry Authors and
licensed under the MIT License.

The work in the DejaVu project was committed to the public domain.

Bitstream Vera Sans Mono Copyright 2003 Bitstream Inc. and licensed under the
Bitstream Vera License with Reserved Font Names "Bitstream" and "Vera".

MIT License

Copyright (c) 2018 Source Foundry Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

BITSTREAM VERA LICENSE

Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. Bitstream Vera is a
trademark of Bitstream, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of
the fonts accompanying this license ("Fonts") and associated documentation
files (the "Font Software"), to reproduce and distribute the Font Software,
including without limitation the rights to use, copy, merge, publish,
distribute, and/or sell copies of the Font Software, and to permit persons to
whom the Font Software is furnished to do so, subject to the following
conditions:

The above copyright and trademark notices and this permission notice shall be
included in all copies of one or more of the Font Software typefaces.

The Font Software may be modified, altered, or added to, and in particular the
designs of glyphs or characters in the Fonts may be modified and additional
glyphs or characters may be added to the Fonts, only if the fonts are renamed
to names not containing either the words "Bitstream" or the word "Vera".

This License becomes null and void to the extent applicable to Fonts or Font
Software that has been modified and is distributed under the "Bitstream Vera"
names.

The Font Software may be sold as part of a larger software package but no copy
of one or more of the Font Software typefaces may be sold by itself.

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL BITSTREAM OR THE GNOME FOUNDATION
BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL,
SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO
USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.

Except as contained in this notice, the names of Gnome, the Gnome Foundation,
and Bitstream Inc., shall not be used in advertising or otherwise to promote
the sale, use or other dealings in this Font Software without prior written
authorization from the Gnome Foundation or Bitstream Inc., respectively. For
further information, contact: fonts at gnome dot org.
```

---

## Polices embarquées

`opale.css` sert Bricolage Grotesque et Chivo depuis le paquet, sans requête vers Google Fonts. Les deux familles sont distribuées sous SIL Open Font License 1.1 ; leurs licences complètes suivent à la fin de ce document.

## Ce qu'Opale, elle, ne dit pas

**Opale n'a aucun fichier de licence à elle**, et `package.json` porte
`"private": true`. En l'absence de licence explicite, le droit d'auteur par
défaut s'applique : tous droits réservés. C'est cohérent avec un paquet privé
consommé par `portfolio` et `travels_in_world`.

**Ce que la 3.1 a changé, et c'est le point à retenir.** En 2.0, le paquet
publiait à sa racine du code MIT qui n'était pas de lui, et la combinaison « code
permissif à la racine, tout droits réservés par défaut sur l'ensemble » méritait
d'être expliquée. Cette tension a disparu avec le code : **tout ce que
`@thomascaron/opale-ui` publie aujourd'hui est écrit par Thomas Caron** — la
charte, le contrat de couleur, les huit composants composés, le catalogue et le
matériau.

La question de la licence reste donc entière, mais elle est redevenue simple :
c'est « quelle licence pour du code entièrement à soi », et non plus « quelle
licence pour un assemblage ». Elle se tranchera le jour où le paquet sera publié
pour de vrai. C'est signalé ici, pas décidé.

## Bricolage Grotesque — SIL Open Font License 1.1

```text
Copyright 2022 The Bricolage Grotesque Project Authors (https://github.com/ateliertriay/bricolage)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Chivo — SIL Open Font License 1.1

```text
Copyright 2019 The Chivo Project Authors (https://github.com/Omnibus-Type/Chivo)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```
