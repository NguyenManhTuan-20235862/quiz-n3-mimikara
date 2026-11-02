"""Extract only vocabulary kanji from a pinned, locally downloaded KanjiVG ZIP.

No network calls or SVG execution. Rebuild command and attribution: data/kanji/README.md.
"""
import argparse
import hashlib
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION = '70a0b7ae0c18ceb5cb358274b029cce0234a43bc'
SOURCE = 'https://github.com/KanjiVG/kanjivg'
LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/3.0/'
SVG_NS = '{http://www.w3.org/2000/svg}'


def is_kanji(char):
    name = unicodedata.name(char, '')
    return name.startswith(('CJK UNIFIED IDEOGRAPH-', 'CJK COMPATIBILITY IDEOGRAPH-'))


def kanji_in(text):
    return list(dict.fromkeys(c for c in text if is_kanji(c)))


def inventory(words):
    characters = {}
    word_characters = {}
    ignored = set()
    for word in words:
        chars = kanji_in(word['kanji'])
        word_characters[str(word['id'])] = chars
        ignored.update(c for c in word['kanji'] if not is_kanji(c))
        for char in chars:
            characters.setdefault(char, []).append(word['id'])
    return {
        'schemaVersion': 1,
        'selection': 'Unique CJK unified/compatibility ideographs in vocab_data.json kanji fields; kana, punctuation and iteration marks excluded.',
        'wordCount': len(words),
        'wordCountWithKanji': sum(bool(c) for c in word_characters.values()),
        'wordCountWithoutKanji': sum(not c for c in word_characters.values()),
        'characterCount': len(characters),
        'characters': {c: {'codepoint': f'U+{ord(c):04X}', 'wordIds': characters[c]} for c in sorted(characters)},
        'wordCharacters': word_characters,
        'excludedCharacters': sorted(ignored),
    }


def extract_svg(raw, char):
    root = ET.fromstring(raw)
    code = f'{ord(char):05x}'
    group = next(g for g in root.iter(SVG_NS + 'g') if g.get('id') == f'kvg:StrokePaths_{code}')
    paths = list(group.iter(SVG_NS + 'path'))
    strokes = []
    for number, path in enumerate(paths, 1):
        if path.get('id') != f'kvg:{code}-s{number}':
            raise ValueError(f'{char}: non-sequential stroke IDs')
        d = path.get('d', '')
        if not d.startswith(('M', 'm')) or not re.fullmatch(r'[MmZzLlHhVvCcSsQqTtAa0-9.,+\s-]+', d):
            raise ValueError(f'{char}: unexpected SVG path')
        strokes.append(d)
    numbers = next(g for g in root.iter(SVG_NS + 'g') if g.get('id') == f'kvg:StrokeNumbers_{code}')
    labels = []
    for number, label in enumerate(numbers.iter(SVG_NS + 'text'), 1):
        transform = label.get('transform', '')
        if label.text != str(number) or not re.fullmatch(r'matrix\([0-9.,+\s-]+\)', transform):
            raise ValueError(f'{char}: invalid stroke label')
        labels.append({'number': number, 'transform': transform})
    if not strokes or len(strokes) != len(labels):
        raise ValueError(f'{char}: inconsistent stroke/label counts')
    return {
        'viewBox': root.get('viewBox'),
        'strokeCount': len(strokes),
        'strokes': strokes,
        'labels': labels,
        'sourceFile': f'kanji/{code}.svg',
        'sourceSha256': hashlib.sha256(raw).hexdigest(),
    }


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def build(archive):
    output = ROOT / 'data/kanji'
    output.mkdir(parents=True, exist_ok=True)
    categories = json.loads((ROOT / 'vocab_data.json').read_text(encoding='utf-8'))
    words = [w for c in categories for t in c['topics'] for w in t['words']]
    info = inventory(words)
    prefix = f'kanjivg-{REVISION}/'
    data, missing = {}, []
    with zipfile.ZipFile(archive) as source:
        names = set(source.namelist())
        # Never extract the archive onto the filesystem.
        license_text = source.read(prefix + 'COPYING')
        for char in info['characters']:
            filename = prefix + f'kanji/{ord(char):05x}.svg'
            if filename not in names:
                missing.append(char)
                continue
            data[char] = extract_svg(source.read(filename), char)
    metadata = {
        'project': 'KanjiVG', 'url': SOURCE, 'revision': REVISION,
        'archiveUrl': f'https://codeload.github.com/KanjiVG/kanjivg/zip/{REVISION}',
        'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'copyright': 'Copyright © 2009–2026 Ulrich Apel and contributors. Individual SVG files retain their original copyright notices in the upstream source.',
        'license': 'CC-BY-SA-3.0', 'licenseUrl': LICENSE_URL,
        'modifications': 'Selected vocabulary kanji only; converted ordered SVG paths and stroke-number transforms to JSON. Geometry, stroke order and label positions unchanged; component metadata and SVG styling omitted.',
    }
    write_json(output / 'inventory.json', info)
    write_json(output / 'strokes.json', {'schemaVersion': 1, 'source': metadata, 'characters': data})
    write_json(output / 'coverage.json', {
        'schemaVersion': 1, 'sourceRevision': REVISION,
        'vocabularySha256': hashlib.sha256((ROOT / 'vocab_data.json').read_bytes()).hexdigest(),
        'wordCount': len(words), 'uniqueKanji': len(info['characters']),
        'availableKanji': len(data), 'missingKanji': missing,
        'fullyCoveredWordsWithKanji': sum(bool(chars) and all(c in data for c in chars) for chars in info['wordCharacters'].values()),
        'wordsWithoutKanji': info['wordCountWithoutKanji'],
        'wordsWithMissingKanji': [int(i) for i, chars in info['wordCharacters'].items() if any(c not in data for c in chars)],
        'strokeDataBytes': (output / 'strokes.json').stat().st_size,
    })
    (output / 'COPYING.KanjiVG.txt').write_bytes(license_text)
    print(f"KanjiVG: {len(data)}/{len(info['characters'])} kanji; {len(missing)} missing; {len(words)} vocabulary entries.")
    if missing:
        raise SystemExit('Incomplete stroke data; see coverage.json')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-zip', type=Path, default=ROOT / 'data/kanji/kanjivg-source.zip')
    build(parser.parse_args().source_zip)
